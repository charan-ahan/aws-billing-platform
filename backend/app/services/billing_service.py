from sqlalchemy.orm import Session

from backend.app.models.billing_record import BillingRecord
from backend.app.schemas.billing import (
    BillingRecordCreate,
    BillingRecordUpdate,
)


def create_billing_record(db: Session, billing: BillingRecordCreate):
    """
    Create a new billing record.
    """

    db_record = BillingRecord(
        payer_account_id=billing.payer_account_id,
        usage_account_id=billing.usage_account_id,
        service=billing.service,
        service_code=billing.service_code,
        region=billing.region,
        usage_start=billing.usage_start,
        usage_end=billing.usage_end,
        usage_amount=billing.usage_amount,
        unit=billing.unit,
        cost=billing.cost,
        currency=billing.currency,
        resource_id=billing.resource_id,
        project=billing.project,
        owner=billing.owner,
        environment=billing.environment,
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return db_record

def get_billing_records(db: Session):
    """
    Get all billing records.
    """
    return db.query(BillingRecord).all()
def get_billing_record_by_id(db: Session, billing_id: int):
    """
    Get one billing record by its ID.
    """
    return (
        db.query(BillingRecord)
        .filter(BillingRecord.id == billing_id)
        .first()
    )
def update_billing_record(db: Session, billing_id: int, billing: BillingRecordUpdate):
    """
    Update an existing billing record.
    """

    db_record = (
        db.query(BillingRecord)
        .filter(BillingRecord.id == billing_id)
        .first()
    )

    if not db_record:
        return None

    for key, value in billing.dict().items():
        setattr(db_record, key, value)

    db.commit()
    db.refresh(db_record)

    return db_record

def delete_billing_record(db: Session, billing_id: int):
    bill = db.query(BillingRecord).filter(
        BillingRecord.id == billing_id
    ).first()

    if bill is None:
        return None

    db.delete(bill)
    db.commit()

    return bill