import csv
import random
from datetime import datetime, timedelta
import json

# ===== CONFIGURATION =====
NUM_RECORDS = 5000
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime.now()

# ===== AWS SERVICES (Categorized) =====
SERVICES = {
    "Compute": [
        "Amazon EC2", "AWS Lambda", "Amazon ECS", "Amazon EKS", 
        "AWS Fargate", "AWS Batch", "Amazon Lightsail"
    ],
    "Storage": [
        "Amazon S3", "Amazon EBS", "Amazon EFS", "Amazon FSx",
        "AWS Backup", "Amazon Glacier", "AWS Storage Gateway"
    ],
    "Database": [
        "Amazon RDS", "Amazon DynamoDB", "Amazon Redshift",
        "Amazon ElastiCache", "Amazon DocumentDB", "Amazon Neptune",
        "Amazon Aurora", "Amazon Timestream"
    ],
    "Networking": [
        "Amazon VPC", "Amazon CloudFront", "AWS Direct Connect",
        "Elastic Load Balancing", "AWS Transit Gateway",
        "Amazon Route 53", "AWS Global Accelerator"
    ],
    "Analytics": [
        "AWS Glue", "Amazon Athena", "Amazon EMR", "Amazon QuickSight",
        "AWS Data Pipeline", "Amazon Kinesis", "AWS Lake Formation"
    ],
    "Other": [
        "AWS CodePipeline", "AWS CodeBuild", "AWS CodeDeploy",
        "AWS CloudTrail", "AWS Config", "Amazon SNS", "Amazon SQS"
    ]
}

REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "sa-east-1", "ca-central-1"
]

INSTANCE_TYPES = [
    "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large",
    "t3.xlarge", "m5.large", "m5.xlarge", "m5.2xlarge",
    "c5.large", "c5.xlarge", "c5.2xlarge",
    "r5.large", "r5.xlarge", "r5.2xlarge",
    "p3.2xlarge", "g4dn.xlarge"
]

OS_TYPES = ["Amazon Linux 2", "Windows Server", "Ubuntu", "Red Hat", "SUSE"]

ENVIRONMENTS = ["Production", "Staging", "Development", "Testing"]

PROJECTS = [
    "E-commerce Platform", "Data Analytics", "Mobile Backend",
    "ML Pipeline", "DevOps Tools", "Customer Portal",
    "AI Research", "Financial Services", "Healthcare App",
    "IoT Platform", "Gaming Server", "Content Delivery"
]

ACCOUNTS = [
    {"id": "111111111111", "name": "Production Account"},
    {"id": "222222222222", "name": "Staging Account"},
    {"id": "333333333333", "name": "Development Account"},
    {"id": "444444444444", "name": "Sandbox Account"}
]

def generate_record(index):
    """Generate one billing record."""
    # Pick a category and service
    category = random.choice(list(SERVICES.keys()))
    service = random.choice(SERVICES[category])
    
    # Dates
    start_date = START_DATE + timedelta(days=random.randint(0, (END_DATE - START_DATE).days))
    end_date = start_date + timedelta(hours=random.randint(1, 24))
    
    # Account
    account = random.choice(ACCOUNTS)
    
    # Cost data
    base_cost = random.uniform(0.5, 500.0)
    if service in ["Amazon EC2", "Amazon RDS", "Amazon Redshift"]:
        base_cost *= 1.5
    if service in ["AWS Lambda", "Amazon S3"]:
        base_cost *= 0.7
    
    usage_amount = round(random.uniform(1.0, 1000.0), 2)
    cost = round(base_cost * random.uniform(0.8, 1.2), 2)
    
    return {
        "payer_account_id": account["id"],
        "usage_account_id": account["id"],
        "account_name": account["name"],
        "service": service,
        "category": category,
        "service_code": service.replace(" ", ""),
        "region": random.choice(REGIONS),
        "instance_type": random.choice(INSTANCE_TYPES) if category == "Compute" else None,
        "os_type": random.choice(OS_TYPES) if category == "Compute" else None,
        "usage_start": start_date.isoformat(),
        "usage_end": end_date.isoformat(),
        "usage_amount": usage_amount,
        "unit": random.choice(["GB", "Hours", "Requests", "GB-Month", "IOPS", "GBps"]),
        "cost": cost,
        "currency": "USD",
        "resource_id": f"resource-{random.randint(1000, 9999)}",
        "project": random.choice(PROJECTS),
        "environment": random.choice(ENVIRONMENTS),
        "pricing_term": random.choice(["OnDemand", "Reserved", "Spot", "SavingsPlan"]),
        "tags": {
            "Owner": random.choice(["team@company.com", "finance@company.com"]),
            "CostCenter": random.choice(["CC-001", "CC-002", "CC-003"])
        }
    }

def generate_csv(filename="cloudkeeper_data.csv"):
    """Generate CSV file."""
    records = [generate_record(i) for i in range(NUM_RECORDS)]
    
    # Flatten tags for CSV
    for r in records:
        r["tags_owner"] = r["tags"]["Owner"]
        r["tags_costcenter"] = r["tags"]["CostCenter"]
        del r["tags"]
    
    with open(filename, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    
    print(f"✅ Generated {len(records)} records in '{filename}'")
    
    # Calculate summary
    total = sum(r["cost"] for r in records)
    print(f"   Total cost: ${total:,.2f}")
    
    # Category breakdown
    category_totals = {}
    for r in records:
        cat = r["category"]
        category_totals[cat] = category_totals.get(cat, 0) + r["cost"]
    
    print("\n📊 Category Breakdown:")
    for cat, val in sorted(category_totals.items(), key=lambda x: -x[1]):
        print(f"   {cat}: ${val:,.2f} ({val/total*100:.1f}%)")
    
    return records

if __name__ == "__main__":
    generate_csv()