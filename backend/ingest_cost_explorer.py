import os
import boto3
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Try to get PostgreSQL URL from environment
POSTGRES_URL = os.getenv("POSTGRES_URL_EXTERNAL") or os.getenv("POSTGRES_URL")

if not POSTGRES_URL:
    logger.error("❌ POSTGRES_URL or POSTGRES_URL_EXTERNAL not set in environment.")
    logger.error("Please add one of these to your .env file or export it.")
    exit(1)

logger.info(f"Using database URL: {POSTGRES_URL[:30]}...")  # Log partial for security

TABLE_NAME = "daily_costs"

# ── AWS Clients ─────────────────────────────────────────────────────────
# Try to load AWS credentials from environment or default profile
try:
    session = boto3.Session(
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=AWS_REGION
    )
    ce_client = session.client('ce')
    logger.info("✅ AWS Cost Explorer client created.")
except Exception as e:
    logger.error(f"❌ Failed to create AWS session: {e}")
    exit(1)

# ── PostgreSQL Engine ──────────────────────────────────────────────────
try:
    engine = create_engine(POSTGRES_URL)
    logger.info("✅ PostgreSQL engine created.")
except Exception as e:
    logger.error(f"❌ Failed to create PostgreSQL engine: {e}")
    exit(1)

# ── Create Table ──────────────────────────────────────────────────────
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
    try:
        with engine.connect() as conn:
            conn.execute(text(create_sql))
            conn.commit()
        logger.info(f"✅ Table '{TABLE_NAME}' ensured.")
    except Exception as e:
        logger.error(f"❌ Failed to create table: {e}")
        raise

# ── Clear existing data ─────────────────────────────────────────────────
def clear_table():
    try:
        with engine.connect() as conn:
            conn.execute(text(f"TRUNCATE TABLE {TABLE_NAME} RESTART IDENTITY"))
            conn.commit()
        logger.info("✅ Table cleared.")
    except Exception as e:
        logger.warning(f"⚠️ Could not clear table: {e}")

# ── Fetch data from Cost Explorer ──────────────────────────────────────
def fetch_cost_data(start_date, end_date):
    """Fetch daily cost grouped by service."""
    try:
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ]
        )
        logger.info("✅ Cost Explorer API call successful.")
    except Exception as e:
        logger.error(f"❌ Cost Explorer API error: {e}")
        return []

    records = []
    for day in response.get('ResultsByTime', []):
        date = day['TimePeriod']['Start']
        total_cost = 0
        for group in day.get('Groups', []):
            keys = group['Keys']
            service = keys[0] if keys else "Unknown"
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            currency = group['Metrics']['UnblendedCost']['Unit']
            
            records.append({
                'usage_date': date,
                'account_id': None,
                'service': service,
                'region': None,
                'cost': cost,
                'currency': currency
            })
            total_cost += cost
        
        # Also add a daily total record
        records.append({
            'usage_date': date,
            'account_id': None,
            'service': 'TOTAL',
            'region': None,
            'cost': total_cost,
            'currency': 'USD'
        })
    
    logger.info(f"✅ Fetched {len(records)} records (including daily totals).")
    return records

# ── Insert into PostgreSQL ─────────────────────────────────────────────
def insert_records(records):
    if not records:
        logger.warning("⚠️ No records to insert.")
        return
    
    df = pd.DataFrame(records)
    df['usage_date'] = pd.to_datetime(df['usage_date']).dt.date
    df = df.drop_duplicates(subset=['usage_date', 'service', 'region'])
    
    # Insert in batches
    batch_size = 1000
    total_inserted = 0
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        try:
            batch.to_sql(TABLE_NAME, engine, if_exists='append', index=False, method='multi')
            total_inserted += len(batch)
            logger.info(f"✅ Inserted batch {i//batch_size + 1} ({len(batch)} records)")
        except Exception as e:
            logger.error(f"❌ Failed to insert batch: {e}")
    
    logger.info(f"✅ Total inserted: {total_inserted} records.")

# ── Main ──────────────────────────────────────────────────────────────
def main():
    logger.info("🚀 Starting Cost Explorer ingestion...")
    
    # Ensure table exists
    create_table()
    
    # Clear old data to avoid duplicates
    clear_table()

    # Fetch last 30 days
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    logger.info(f"📅 Fetching data from {start_date} to {end_date}")
    records = fetch_cost_data(start_date, end_date)
    
    if records:
        insert_records(records)
        logger.info("🎉 Ingestion complete!")
    else:
        logger.warning("⚠️ No data fetched. Check AWS permissions and region.")

if __name__ == "__main__":
    main()