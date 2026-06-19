from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.dependencies import get_db
from backend.app.schemas.billing import (
    BillingRecordCreate,
    BillingRecordResponse,
    BillingRecordUpdate,
)
from backend.app.services.billing_service import (
    create_billing_record,
    get_billing_records,
    get_billing_record_by_id,
    update_billing_record,
    delete_billing_record,
)

router = APIRouter(
    prefix="/billing",
    tags=["Billing"],
)


@router.post("/", response_model=BillingRecordResponse)
def create_bill(
    billing: BillingRecordCreate,
    db: Session = Depends(get_db),
):
    return create_billing_record(db, billing)


@router.get("/", response_model=List[BillingRecordResponse])
def get_all_bills(
    db: Session = Depends(get_db),
):
    return get_billing_records(db)


@router.get("/{billing_id}", response_model=BillingRecordResponse)
def get_bill_by_id(
    billing_id: int,
    db: Session = Depends(get_db),
):
    bill = get_billing_record_by_id(db, billing_id)

    if bill is None:
        raise HTTPException(
            status_code=404,
            detail="Billing record not found",
        )

    return bill


@router.put("/{billing_id}", response_model=BillingRecordResponse)
def update_bill(
    billing_id: int,
    billing: BillingRecordUpdate,
    db: Session = Depends(get_db),
):
    bill = update_billing_record(db, billing_id, billing)

    if bill is None:
        raise HTTPException(
            status_code=404,
            detail="Billing record not found",
        )

    return bill 

@router.delete("/{billing_id}", response_model=BillingRecordResponse)
def delete_bill(
    billing_id: int,
    db: Session = Depends(get_db),
):
    bill = delete_billing_record(db, billing_id)

    if bill is None:
        raise HTTPException(
            status_code=404,
            detail="Billing record not found",
        )

    return bill