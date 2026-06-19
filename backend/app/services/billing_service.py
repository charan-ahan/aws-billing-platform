from sqlalchemy.orm import Session

from backend.app.models.billing_record import BillingRecord
from backend.app.schemas.billing import BillingRecordCreate


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