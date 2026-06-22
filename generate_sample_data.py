import csv
import random
from datetime import datetime, timedelta

# Configuration
NUM_RECORDS = 200
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime.now()

# Predefined values
SERVICES = [
    "Amazon EC2", "Amazon S3", "AWS Lambda", "Amazon RDS",
    "Amazon DynamoDB", "Amazon CloudFront", "Amazon VPC",
    "AWS Glue", "Amazon Redshift", "AWS CodePipeline"
]

PROJECTS = [
    "Project Alpha", "Project Beta", "Project Gamma",
    "Project Delta", "Project Epsilon", "Project Zeta",
    "Data Platform", "Analytics Hub", "Cloud Migration",
    "DevOps Automation"
]

ENVIRONMENTS = ["Production", "Staging", "Development", "Testing"]
UNITS = ["GB", "Hours", "Requests", "GB-Month", "IOPS", "GBps"]

OWNERS = [
    "alice@company.com", "bob@company.com", "charlie@company.com",
    "diana@company.com", "eve@company.com", "frank@company.com"
]

ACCOUNTS = ["123456789012", "123456789013", "123456789014", "123456789015"]

REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]


def generate_random_date():
    """Generate a random date between START_DATE and END_DATE."""
    delta = END_DATE - START_DATE
    random_days = random.randint(0, delta.days)
    return START_DATE + timedelta(days=random_days)


def generate_record(index):
    """Generate one billing record as a dict."""
    start_date = generate_random_date()
    end_date = start_date + timedelta(hours=random.randint(1, 24))
    
    cost = round(random.uniform(5.0, 500.0), 2)
    
    return {
        "payer_account_id": random.choice(ACCOUNTS),
        "usage_account_id": random.choice(ACCOUNTS),
        "service": random.choice(SERVICES),
        "service_code": random.choice(SERVICES).replace(" ", ""),
        "region": random.choice(REGIONS),
        "usage_start": start_date.isoformat(),
        "usage_end": end_date.isoformat(),
        "usage_amount": round(random.uniform(1.0, 1000.0), 2),
        "unit": random.choice(UNITS),
        "cost": cost,
        "currency": "USD",
        "resource_id": f"resource-{random.randint(1000, 9999)}",
        "project": random.choice(PROJECTS),
        "owner": random.choice(OWNERS),
        "environment": random.choice(ENVIRONMENTS)
    }


def generate_csv(filename="sample_large_data.csv"):
    """Generate CSV file with sample data."""
    # Generate records
    records = [generate_record(i) for i in range(NUM_RECORDS)]
    
    # Write to CSV
    with open(filename, "w", newline="") as f:
        if records:
            writer = csv.DictWriter(f, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
    
    print(f"✅ Generated {len(records)} records in '{filename}'")
    print(f"   Total cost: ${sum(r['cost'] for r in records):.2f}")


if __name__ == "__main__":
    generate_csv()