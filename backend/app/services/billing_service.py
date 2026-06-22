from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from backend.app.models.billing_record import BillingRecord
from backend.app.schemas.billing import BillingRecordCreate, BillingRecordUpdate


class BillingService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_billing_record(self, billing_data: BillingRecordCreate):
        """Create a new billing record."""
        db_record = BillingRecord(**billing_data.dict())
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        return db_record
    
    def get_billing_records(self, skip: int = 0, limit: int = 100):
        """Get all billing records with pagination."""
        return self.db.query(BillingRecord).offset(skip).limit(limit).all()
    
    def get_billing_record_by_id(self, billing_id: int):
        """Get a specific billing record by ID."""
        return self.db.query(BillingRecord).filter(BillingRecord.id == billing_id).first()
    
    def update_billing_record(self, billing_id: int, billing_data: BillingRecordUpdate):
        """Update a billing record."""
        db_record = self.get_billing_record_by_id(billing_id)
        if not db_record:
            return None
        
        update_data = billing_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_record, key, value)
        
        self.db.commit()
        self.db.refresh(db_record)
        return db_record
    
    def delete_billing_record(self, billing_id: int):
        """Delete a billing record."""
        db_record = self.get_billing_record_by_id(billing_id)
        if not db_record:
            return False
        
        self.db.delete(db_record)
        self.db.commit()
        return True
    
    # ----- Analytics Methods with Date Filtering -----
    
    def _apply_date_filter(self, query, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Apply date filtering to a query."""
        if start_date:
            query = query.filter(BillingRecord.usage_start >= start_date)
        if end_date:
            query = query.filter(BillingRecord.usage_start <= end_date)
        return query
    
    def get_analytics_summary(self, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get summary analytics with optional date filter."""
        # Base query
        query = self.db.query(BillingRecord)
        
        # Apply date filter
        query = self._apply_date_filter(query, start_date, end_date)
        
        total_records = query.count()
        total_cost = query.with_entities(func.sum(BillingRecord.cost)).scalar() or 0.0
        avg_cost = query.with_entities(func.avg(BillingRecord.cost)).scalar() or 0.0
        
        # Service breakdown
        service_breakdown = self.db.query(
            BillingRecord.service,
            func.sum(BillingRecord.cost).label('total_cost')
        )
        service_breakdown = self._apply_date_filter(service_breakdown, start_date, end_date)
        service_breakdown = service_breakdown.group_by(BillingRecord.service).all()
        
        # Project breakdown
        project_breakdown = self.db.query(
            BillingRecord.project,
            func.sum(BillingRecord.cost).label('total_cost')
        )
        project_breakdown = self._apply_date_filter(project_breakdown, start_date, end_date)
        project_breakdown = project_breakdown.group_by(BillingRecord.project).all()
        
        # Environment breakdown
        env_breakdown = self.db.query(
            BillingRecord.environment,
            func.sum(BillingRecord.cost).label('total_cost')
        )
        env_breakdown = self._apply_date_filter(env_breakdown, start_date, end_date)
        env_breakdown = env_breakdown.group_by(BillingRecord.environment).all()
        
        return {
            "total_records": total_records,
            "total_cost": float(total_cost),
            "average_cost": float(avg_cost),
            "service_breakdown": [{"service": row[0], "total_cost": float(row[1])} for row in service_breakdown],
            "project_breakdown": [{"project": row[0], "total_cost": float(row[1])} for row in project_breakdown],
            "environment_breakdown": [{"environment": row[0], "total_cost": float(row[1])} for row in env_breakdown],
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
    
    def get_monthly_trend(self, months: int = 12, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get monthly trend with optional date filter."""
        # If both dates are provided, use them instead of months
        if start_date and end_date:
            # Get all months between start and end
            query = self.db.query(
                func.strftime('%Y-%m', BillingRecord.usage_start).label('month'),
                func.sum(BillingRecord.cost).label('total_cost')
            )
            query = self._apply_date_filter(query, start_date, end_date)
            query = query.group_by('month').order_by('month')
            results = query.all()
        else:
            # Use months parameter
            end_date_dt = datetime.now()
            start_date_dt = end_date_dt - relativedelta(months=months)
            
            query = self.db.query(
                func.strftime('%Y-%m', BillingRecord.usage_start).label('month'),
                func.sum(BillingRecord.cost).label('total_cost')
            ).filter(
                BillingRecord.usage_start >= start_date_dt
            ).group_by(
                'month'
            ).order_by(
                'month'
            )
            
            results = query.all()
        
        monthly_data = []
        for row in results:
            monthly_data.append({
                "month": row.month,
                "total_cost": float(row.total_cost)
            })
        
        return monthly_data
    
    def get_top_services(self, limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get top N services with optional date filter."""
        query = self.db.query(
            BillingRecord.service,
            func.sum(BillingRecord.cost).label('total_cost')
        )
        query = self._apply_date_filter(query, start_date, end_date)
        results = query.group_by(
            BillingRecord.service
        ).order_by(
            desc('total_cost')
        ).limit(limit).all()
        
        return [{"service": row[0], "total_cost": float(row[1])} for row in results]
    
    def get_top_projects(self, limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get top N projects with optional date filter."""
        query = self.db.query(
            BillingRecord.project,
            func.sum(BillingRecord.cost).label('total_cost')
        )
        query = self._apply_date_filter(query, start_date, end_date)
        results = query.group_by(
            BillingRecord.project
        ).order_by(
            desc('total_cost')
        ).limit(limit).all()
        
        return [{"project": row[0], "total_cost": float(row[1])} for row in results]
    
    def get_current_month_summary(self):
        """Get current month's total cost and compare with previous month."""
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        # Current month cost
        current_cost = self.db.query(func.sum(BillingRecord.cost)).filter(
            BillingRecord.usage_start >= current_month_start
        ).scalar() or 0.0
        
        # Previous month cost
        prev_cost = self.db.query(func.sum(BillingRecord.cost)).filter(
            BillingRecord.usage_start >= previous_month_start,
            BillingRecord.usage_start < current_month_start
        ).scalar() or 0.0
        
        # Calculate percentage change
        if prev_cost > 0:
            change_percent = ((current_cost - prev_cost) / prev_cost) * 100
        else:
            change_percent = None if current_cost == 0 else 100.0
        
        return {
            "current_month": current_month_start.strftime('%Y-%m'),
            "current_month_cost": float(current_cost),
            "previous_month": previous_month_start.strftime('%Y-%m'),
            "previous_month_cost": float(prev_cost),
            "change_percent": change_percent
        }