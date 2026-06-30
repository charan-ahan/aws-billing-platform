import os
import boto3
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
POSTGRES_URL = os.getenv("POSTGRES_URL")
TABLE_NAME = "daily_costs"

# ── AWS Clients ─────────────────────────────────────────────────────────
session = boto3.Session(
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION
)
ce_client = session.client('ce')

# ── PostgreSQL Engine ──────────────────────────────────────────────────
engine = create_engine(POSTGRES_URL)

# ── Create Table if not exists ────────────────────────────────────────
def create_table():
    create_sql = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        usage_date DATE NOT NULL,
        account_id VARCHAR(50),
        service VARCHAR(100),
        region VARCHAR(50),
        cost DECIMAL(12,6),
        currency VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_daily_costs_date ON {TABLE_NAME}(usage_date);
    CREATE INDEX IF NOT EXISTS idx_daily_costs_service ON {TABLE_NAME}(service);
    """
    with engine.connect() as conn:
        conn.execute(text(create_sql))
        conn.commit()
    logger.info(f"Table '{TABLE_NAME}' ensured.")

# ── Fetch data from Cost Explorer ──────────────────────────────────────
def fetch_cost_data(start_date, end_date):
    """
    Fetch daily cost grouped by service and region.
    """
    response = ce_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date,
            'End': end_date
        },
        Granularity='DAILY',
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'SERVICE'},
            {'Type': 'DIMENSION', 'Key': 'REGION'}
        ]
    )

    records = []
    for day in response['ResultsByTime']:
        date = day['TimePeriod']['Start']
        for group in day['Groups']:
            keys = group['Keys']
            service = keys[0]
            region = keys[1]
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            currency = group['Metrics']['UnblendedCost']['Unit']
            records.append({
                'usage_date': date,
                'account_id': None,
                'service': service,
                'region': region,
                'cost': cost,
                'currency': currency
            })
    return records

# ── Insert into PostgreSQL ─────────────────────────────────────────────
def insert_records(records):
    if not records:
        logger.warning("No records to insert.")
        return
    df = pd.DataFrame(records)
    df['usage_date'] = pd.to_datetime(df['usage_date']).dt.date
    df = df.drop_duplicates(subset=['usage_date', 'service', 'region'])
    df.to_sql(TABLE_NAME, engine, if_exists='append', index=False, method='multi')
    logger.info(f"Inserted {len(df)} records.")

# ── Main ──────────────────────────────────────────────────────────────
def main():
    logger.info("Starting Cost Explorer ingestion...")
    create_table()

    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    logger.info(f"Fetching data from {start_date} to {end_date}")
    records = fetch_cost_data(start_date, end_date)
    if records:
        insert_records(records)
        logger.info("Ingestion complete.")
    else:
        logger.warning("No data fetched.")

if __name__ == "__main__":
    main()