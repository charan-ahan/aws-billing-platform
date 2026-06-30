from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io

from backend.app.database.dependencies import get_db
from backend.app.schemas.billing import BillingRecordCreate, BillingRecordResponse, BillingRecordUpdate
from backend.app.services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["billing"])

# ── CRUD Endpoints ─────────────────────────────────────────────────────────

@router.post("/", response_model=BillingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_billing_record(
    billing_data: BillingRecordCreate,
    db: Session = Depends(get_db)
):
    """Create a new billing record."""
    service = BillingService(db)
    return service.create_billing_record(billing_data)

@router.get("/", response_model=List[BillingRecordResponse])
def get_billing_records(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all billing records with pagination."""
    service = BillingService(db)
    return service.get_billing_records(skip=skip, limit=limit)

@router.get("/{billing_id}", response_model=BillingRecordResponse)
def get_billing_record(
    billing_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific billing record by ID."""
    service = BillingService(db)
    record = service.get_billing_record_by_id(billing_id)
    if not record:
        raise HTTPException(status_code=404, detail="Billing record not found")
    return record

@router.put("/{billing_id}", response_model=BillingRecordResponse)
def update_billing_record(
    billing_id: int,
    billing_data: BillingRecordUpdate,
    db: Session = Depends(get_db)
):
    """Update a billing record."""
    service = BillingService(db)
    record = service.update_billing_record(billing_id, billing_data)
    if not record:
        raise HTTPException(status_code=404, detail="Billing record not found")
    return record

@router.delete("/{billing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_billing_record(
    billing_id: int,
    db: Session = Depends(get_db)
):
    """Delete a billing record."""
    service = BillingService(db)
    success = service.delete_billing_record(billing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Billing record not found")
    return None

# ── CSV Import ──────────────────────────────────────────────────────────────

@router.post("/import-csv", status_code=status.HTTP_201_CREATED)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import billing records from a CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Convert account IDs to strings
        df['payer_account_id'] = df['payer_account_id'].astype(str)
        df['usage_account_id'] = df['usage_account_id'].astype(str)
        
        records = df.to_dict(orient='records')
        service = BillingService(db)
        created_count = 0
        errors = []
        
        for idx, record_data in enumerate(records):
            try:
                if 'usage_start' in record_data and isinstance(record_data['usage_start'], str):
                    record_data['usage_start'] = pd.to_datetime(record_data['usage_start']).isoformat()
                if 'usage_end' in record_data and isinstance(record_data['usage_end'], str):
                    record_data['usage_end'] = pd.to_datetime(record_data['usage_end']).isoformat()
                
                billing_record = BillingRecordCreate(**record_data)
                service.create_billing_record(billing_record)
                created_count += 1
            except Exception as e:
                errors.append({"row": idx + 1, "error": str(e), "data": record_data})
        
        return {
            "message": f"Successfully imported {created_count} records",
            "total_rows": len(records),
            "created_count": created_count,
            "errors": errors
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or malformed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

# ── Analytics Endpoints (Real Data from PostgreSQL) ───────────────────────

@router.get("/analytics/summary")
def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get summary analytics with optional date filtering.
    Uses real data from daily_costs table.
    """
    service = BillingService(db)
    return service.get_analytics_summary(start_date, end_date)

@router.get("/analytics/monthly-trend")
def get_monthly_trend(
    months: int = Query(12, description="Number of months to include"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get monthly cost trend with optional date filtering.
    Uses real data from daily_costs table.
    """
    service = BillingService(db)
    return service.get_monthly_trend(months, start_date, end_date)

@router.get("/analytics/top-services")
def get_top_services(
    limit: int = Query(5, description="Number of services to return"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get top N services by cost.
    Uses real data from daily_costs table.
    """
    service = BillingService(db)
    return service.get_top_services(limit, start_date, end_date)

@router.get("/analytics/top-projects")
def get_top_projects(
    limit: int = Query(5, description="Number of projects to return"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get top N projects by cost.
    Currently uses mock data (projects not available in daily_costs).
    """
    service = BillingService(db)
    return service.get_top_projects(limit, start_date, end_date)

@router.get("/analytics/region-breakdown")
def get_region_breakdown(
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get cost breakdown by region.
    Uses real data from daily_costs table.
    """
    service = BillingService(db)
    return service.get_region_breakdown(start_date, end_date)

@router.get("/analytics/environment-breakdown")
def get_environment_breakdown(
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get cost breakdown by environment.
    Currently uses mock data (tags not available in daily_costs).
    """
    service = BillingService(db)
    return service.get_environment_breakdown(start_date, end_date)

@router.get("/analytics/current-month")
def get_current_month_summary(db: Session = Depends(get_db)):
    """
    Get current month's total cost and comparison with previous month.
    Uses real data from daily_costs table.
    """
    service = BillingService(db)
    return service.get_current_month_summary()