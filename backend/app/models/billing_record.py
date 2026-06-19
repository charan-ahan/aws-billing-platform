from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Index,
)

from backend.app.database.base import Base


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)

    payer_account_id = Column(String(20), nullable=False)
    usage_account_id = Column(String(20), nullable=False)

    service = Column(String(100), nullable=False)
    service_code = Column(String(100))
    region = Column(String(50))

    usage_start = Column(DateTime)
    usage_end = Column(DateTime)
    usage_amount = Column(Float)
    unit = Column(String(50))

    cost = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")

    resource_id = Column(String(255))

    project = Column(String(100))
    owner = Column(String(100))
    environment = Column(String(50))


Index("idx_service", BillingRecord.service)
Index("idx_region", BillingRecord.region)
Index("idx_usage_start", BillingRecord.usage_start)
Index("idx_project", BillingRecord.project)