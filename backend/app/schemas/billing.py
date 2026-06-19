from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BillingRecordCreate(BaseModel):
    payer_account_id: str
    usage_account_id: str

    service: str
    service_code: Optional[str] = None
    region: Optional[str] = None

    usage_start: Optional[datetime] = None
    usage_end: Optional[datetime] = None

    usage_amount: Optional[float] = None
    unit: Optional[str] = None

    cost: float
    currency: str = "USD"

    resource_id: Optional[str] = None

    project: Optional[str] = None
    owner: Optional[str] = None
    environment: Optional[str] = None


class BillingRecordResponse(BillingRecordCreate):
    id: int

    class Config:
        from_attributes = True
class BillingRecordUpdate(BillingRecordCreate):
    pass