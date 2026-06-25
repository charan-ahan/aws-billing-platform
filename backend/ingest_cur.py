import os
import pandas as pd
import boto3
from sqlalchemy import create_engine
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== CONFIGURATION =====
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://user:pass@host:port/db")
S3_BUCKET = os.getenv("S3_BUCKET", "your-cur-bucket-name")
CUR_PREFIX = os.getenv("CUR_PREFIX", "cur/")  # folder path in S3
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
TABLE_NAME = "billing_records"


def get_s3_client():
    """Initialize S3 client using environment variables."""
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def get_latest_cur_file(s3_client):
    """Find the most recent CUR file in S3."""
    response = s3_client.list_objects_v2(
        Bucket=S3_BUCKET,
        Prefix=CUR_PREFIX,
    )
    objects = response.get("Contents", [])
    if not objects:
        logger.error("No objects found in S3 bucket.")
        return None
    latest = sorted(objects, key=lambda x: x["LastModified"], reverse=True)[0]
    logger.info(f"Latest file: {latest['Key']}")
    return latest["Key"]


def read_cur_file(s3_client, key):
    """Read CUR file from S3 (supports CSV and Parquet)."""
    obj = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
    if key.endswith(".parquet"):
        return pd.read_parquet(obj["Body"])
    elif key.endswith(".csv"):
        return pd.read_csv(obj["Body"])
    else:
        raise ValueError(f"Unsupported file format: {key}")


def transform_cur_data(df):
    """Transform CUR data to match your schema."""
    # Rename columns to match your model
    column_map = {
        "line_item_usage_start_date": "usage_start",
        "line_item_usage_end_date": "usage_end",
        "line_item_usage_amount": "usage_amount",
        "line_item_unblended_cost": "cost",
        "line_item_currency_code": "currency",
        "product_service_code": "service_code",
        "product_region": "region",
        "product_instance_type": "instance_type",
        "bill_payer_account_id": "payer_account_id",
        "line_item_usage_account_id": "usage_account_id",
        "line_item_resource_id": "resource_id",
        "resource_tags": "tags",
    }
    df = df.rename(columns=column_map)

    # Convert date columns
    if "usage_start" in df.columns:
        df["usage_start"] = pd.to_datetime(df["usage_start"]).dt.strftime("%Y-%m-%d %H:%M:%S")
    if "usage_end" in df.columns:
        df["usage_end"] = pd.to_datetime(df["usage_end"]).dt.strftime("%Y-%m-%d %H:%M:%S")

    # Handle missing columns
    default_columns = {
        "unit": "GB",
        "project": "Uncategorized",
        "owner": "Unknown",
        "environment": "Unknown",
    }
    for col, default in default_columns.items():
        if col not in df.columns:
            df[col] = default

    return df


def load_to_postgres(df):
    """Load transformed data into PostgreSQL."""
    engine = create_engine(POSTGRES_URL)
    try:
        df.to_sql(TABLE_NAME, engine, if_exists="append", index=False, method="multi")
        logger.info(f"Loaded {len(df)} records into {TABLE_NAME}")
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise


def main():
    logger.info("Starting CUR ingestion...")
    s3_client = get_s3_client()
    key = get_latest_cur_file(s3_client)
    if not key:
        return
    raw_df = read_cur_file(s3_client, key)
    transformed_df = transform_cur_data(raw_df)
    load_to_postgres(transformed_df)
    logger.info("CUR ingestion complete!")


if __name__ == "__main__":
    main()