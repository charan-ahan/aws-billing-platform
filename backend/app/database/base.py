from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here
from backend.app.models.billing_record import BillingRecord