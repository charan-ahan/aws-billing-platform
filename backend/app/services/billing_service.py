from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from backend.app.models.billing_record import BillingRecord
from backend.app.schemas.billing import BillingRecordCreate, BillingRecordUpdate


# ── Service to Category Mapping ──────────────────────────────────────────
SERVICE_CATEGORY_MAP = {
    "Amazon EC2": "Compute",
    "AWS Lambda": "Compute",
    "Amazon ECS": "Compute",
    "Amazon EKS": "Compute",
    "AWS Fargate": "Compute",
    "AWS Batch": "Compute",
    "Amazon Lightsail": "Compute",
    "Amazon S3": "Storage",
    "Amazon EBS": "Storage",
    "Amazon EFS": "Storage",
    "Amazon FSx": "Storage",
    "AWS Backup": "Storage",
    "Amazon Glacier": "Storage",
    "AWS Storage Gateway": "Storage",
    "Amazon RDS": "Database",
    "Amazon DynamoDB": "Database",
    "Amazon Redshift": "Database",
    "Amazon ElastiCache": "Database",
    "Amazon DocumentDB": "Database",
    "Amazon Neptune": "Database",
    "Amazon Aurora": "Database",
    "Amazon Timestream": "Database",
    "Amazon VPC": "Networking",
    "Amazon CloudFront": "Networking",
    "AWS Direct Connect": "Networking",
    "Elastic Load Balancing": "Networking",
    "AWS Transit Gateway": "Networking",
    "Amazon Route 53": "Networking",
    "AWS Global Accelerator": "Networking",
    "AWS Glue": "Analytics",
    "Amazon Athena": "Analytics",
    "Amazon EMR": "Analytics",
    "Amazon QuickSight": "Analytics",
    "AWS Data Pipeline": "Analytics",
    "Amazon Kinesis": "Analytics",
    "AWS Lake Formation": "Analytics",
    "AWS CodePipeline": "Other",
    "AWS CodeBuild": "Other",
    "AWS CodeDeploy": "Other",
    "AWS CloudTrail": "Other",
    "AWS Config": "Other",
    "Amazon SNS": "Other",
    "Amazon SQS": "Other",
}

def get_category(service: str) -> str:
    """Map service to category."""
    # Try exact match first
    if service in SERVICE_CATEGORY_MAP:
        return SERVICE_CATEGORY_MAP[service]
    
    # Try partial match
    for key, category in SERVICE_CATEGORY_MAP.items():
        if key.lower() in service.lower() or service.lower() in key.lower():
            return category
    
    return "Other"


class BillingService:
    def __init__(self, db: Session):
        self.db = db
    
    # ── CRUD Operations ──────────────────────────────────────────────────────
    
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
    
    # ── Analytics (Real Data from daily_costs table) ──────────────────────
    
    def _apply_filters(self, query, account: str = 'all', service: str = 'all', region: str = 'all'):
        """Apply common filters to query."""
        if account != 'all':
            query = query.filter(text("account_id = :account")).params(account=account)
        if service != 'all':
            query = query.filter(text("service = :service")).params(service=service)
        if region != 'all':
            query = query.filter(text("region = :region")).params(region=region)
        return query
    
    def get_analytics_summary(self, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get summary analytics from real PostgreSQL data."""
        # Default to last 30 days
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Build query
        query = text("""
            SELECT 
                COUNT(*) AS total_records,
                SUM(cost) AS total_cost,
                AVG(cost) AS avg_cost,
                COUNT(DISTINCT service) AS service_count,
                COUNT(DISTINCT region) AS region_count
            FROM daily_costs
            WHERE usage_date BETWEEN :start_date AND :end_date
        """)
        
        result = self.db.execute(query, {"start_date": start_date, "end_date": end_date}).first()
        
        # Get service breakdown
        service_query = text("""
            SELECT 
                service,
                SUM(cost) AS total_cost
            FROM daily_costs
            WHERE usage_date BETWEEN :start_date AND :end_date
            GROUP BY service
            ORDER BY total_cost DESC
        """)
        service_results = self.db.execute(service_query, {"start_date": start_date, "end_date": end_date}).all()
        
        service_breakdown = [
            {"service": row[0], "total_cost": float(row[1])} for row in service_results
        ]
        
        # Get category breakdown
        category_query = text("""
            SELECT 
                service,
                SUM(cost) AS total_cost
            FROM daily_costs
            WHERE usage_date BETWEEN :start_date AND :end_date
            GROUP BY service
            ORDER BY total_cost DESC
        """)
        category_results = self.db.execute(category_query, {"start_date": start_date, "end_date": end_date}).all()
        
        category_map = {}
        for row in category_results:
            cat = get_category(row[0])
            category_map[cat] = category_map.get(cat, 0) + float(row[1])
        
        category_breakdown = [
            {"category": cat, "total_cost": cost} for cat, cost in category_map.items()
        ]
        
        return {
            "total_records": result[0],
            "total_cost": float(result[1] or 0),
            "average_cost": float(result[2] or 0),
            "service_count": result[3],
            "region_count": result[4],
            "service_breakdown": service_breakdown,
            "category_breakdown": category_breakdown,
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
    
    def get_monthly_trend(self, months: int = 12, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get monthly trend from real PostgreSQL data."""
        if start_date and end_date:
            query = text("""
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', usage_date), 'YYYY-MM') AS month,
                    SUM(cost) AS total_cost
                FROM daily_costs
                WHERE usage_date BETWEEN :start_date AND :end_date
                GROUP BY DATE_TRUNC('month', usage_date)
                ORDER BY month ASC
            """)
            results = self.db.execute(query, {"start_date": start_date, "end_date": end_date}).all()
        else:
            query = text("""
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', usage_date), 'YYYY-MM') AS month,
                    SUM(cost) AS total_cost
                FROM daily_costs
                WHERE usage_date >= NOW() - INTERVAL ':months months'
                GROUP BY DATE_TRUNC('month', usage_date)
                ORDER BY month ASC
            """)
            results = self.db.execute(query, {"months": months}).all()
        
        return [
            {"month": row[0], "total_cost": float(row[1] or 0)} for row in results
        ]
    
    def get_top_services(self, limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get top N services by cost from real PostgreSQL data."""
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        query = text("""
            SELECT 
                service,
                SUM(cost) AS total_cost
            FROM daily_costs
            WHERE usage_date BETWEEN :start_date AND :end_date
            GROUP BY service
            ORDER BY total_cost DESC
            LIMIT :limit
        """)
        
        results = self.db.execute(query, {
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit
        }).all()
        
        return [
            {"service": row[0], "total_cost": float(row[1] or 0)} for row in results
        ]
    
    def get_top_projects(self, limit: int = 5, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get top N projects by cost (mock for now)."""
        # Projects aren't in daily_costs, so return mock data
        return [
            {"project": "Production Infrastructure", "total_cost": 45200.50},
            {"project": "Data Analytics Platform", "total_cost": 28400.75},
            {"project": "Development Environment", "total_cost": 18900.30},
            {"project": "Staging Environment", "total_cost": 12300.20},
            {"project": "ML Pipeline", "total_cost": 8600.45}
        ]
    
    def get_region_breakdown(self, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get region breakdown from real PostgreSQL data."""
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        query = text("""
            SELECT 
                region,
                SUM(cost) AS total_cost
            FROM daily_costs
            WHERE usage_date BETWEEN :start_date AND :end_date
                AND region IS NOT NULL
                AND region != ''
            GROUP BY region
            ORDER BY total_cost DESC
        """)
        
        results = self.db.execute(query, {"start_date": start_date, "end_date": end_date}).all()
        
        return [
            {"region": row[0], "total_cost": float(row[1] or 0)} for row in results
        ]
    
    def get_environment_breakdown(self, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Get environment breakdown (mock for now — tags not available in daily_costs)."""
        return [
            {"environment": "Production", "total_cost": 45200.50},
            {"environment": "Staging", "total_cost": 18900.30},
            {"environment": "Development", "total_cost": 12300.20},
            {"environment": "Testing", "total_cost": 8600.45}
        ]
    
    def get_current_month_summary(self):
        """Get current month's total cost and compare with previous month."""
        query = text("""
            WITH current_month AS (
                SELECT SUM(cost) AS cost
                FROM daily_costs
                WHERE DATE_TRUNC('month', usage_date) = DATE_TRUNC('month', CURRENT_DATE)
            ),
            previous_month AS (
                SELECT SUM(cost) AS cost
                FROM daily_costs
                WHERE DATE_TRUNC('month', usage_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            )
            SELECT 
                COALESCE((SELECT cost FROM current_month), 0) AS current_month_cost,
                COALESCE((SELECT cost FROM previous_month), 0) AS previous_month_cost
        """)
        
        result = self.db.execute(query).first()
        current = float(result[0] or 0)
        previous = float(result[1] or 0)
        
        if previous > 0:
            change_percent = ((current - previous) / previous) * 100
        else:
            change_percent = None
        
        return {
            "current_month": datetime.now().strftime('%Y-%m'),
            "current_month_cost": current,
            "previous_month": (datetime.now() - relativedelta(months=1)).strftime('%Y-%m'),
            "previous_month_cost": previous,
            "change_percent": change_percent
        }