"""
SQL Queries for Billing Analytics
All queries are written for PostgreSQL and compatible with the billing_records table.
"""

# ============================================================
# 1. OVERVIEW / SUMMARY
# ============================================================

OVERVIEW_QUERY = """
WITH date_range AS (
    SELECT 
        COALESCE(
            %(start_date)s::date,
            date_trunc('month', CURRENT_DATE)
        ) AS start_date,
        COALESCE(
            %(end_date)s::date,
            CURRENT_DATE
        ) AS end_date
)
SELECT 
    COUNT(*) AS total_records,
    SUM(cost) AS total_cost,
    AVG(cost) AS avg_cost,
    ROUND(AVG(cost)::numeric, 2) AS avg_cost_rounded,
    ROUND(SUM(cost)::numeric / NULLIF(EXTRACT(DAY FROM (SELECT end_date - start_date FROM date_range)), 0), 2) AS daily_avg,
    ROUND(SUM(cost)::numeric * 1.08, 2) AS forecast_30d
FROM billing_records, date_range
WHERE 
    usage_start >= (SELECT start_date FROM date_range)
    AND usage_start <= (SELECT end_date FROM date_range)
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(service)s = 'all' OR service = %(service)s)
    AND (%(region)s = 'all' OR region = %(region)s);
"""


# ============================================================
# 2. MONTHLY TREND
# ============================================================

MONTHLY_TREND_QUERY = """
SELECT 
    TO_CHAR(DATE_TRUNC('month', usage_start), 'YYYY-MM') AS month,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(service)s = 'all' OR service = %(service)s)
    AND (%(region)s = 'all' OR region = %(region)s)
GROUP BY DATE_TRUNC('month', usage_start)
ORDER BY month ASC
LIMIT 24;
"""


# ============================================================
# 3. COST BY SERVICE
# ============================================================

SERVICE_BREAKDOWN_QUERY = """
SELECT 
    service,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(region)s = 'all' OR region = %(region)s)
GROUP BY service
ORDER BY total_cost DESC;
"""


# ============================================================
# 4. COST BY CATEGORY (Compute, Storage, etc.)
# ============================================================

CATEGORY_BREAKDOWN_QUERY = """
WITH category_mapping AS (
    SELECT 
        cost,
        CASE 
            WHEN service IN ('Amazon EC2', 'AWS Lambda', 'Elastic Load Balancing', 'Amazon ECS', 'Amazon EKS', 'AWS Fargate') THEN 'Compute'
            WHEN service IN ('Amazon S3', 'Amazon EBS', 'Amazon EFS', 'AWS Backup', 'Amazon Glacier') THEN 'Storage'
            WHEN service IN ('Amazon RDS', 'Amazon DynamoDB', 'Amazon Redshift', 'Amazon ElastiCache', 'Amazon DocumentDB') THEN 'Database'
            WHEN service IN ('Amazon VPC', 'AWS Direct Connect', 'Elastic Load Balancing', 'Amazon CloudFront', 'AWS Transit Gateway') THEN 'Networking'
            WHEN service IN ('AWS Glue', 'Amazon Athena', 'Amazon EMR', 'Amazon QuickSight', 'AWS Data Pipeline') THEN 'Analytics'
            ELSE 'Other'
        END AS category
    FROM billing_records
    WHERE 
        usage_start >= %(start_date)s::date
        AND usage_start <= %(end_date)s::date
        AND (%(account)s = 'all' OR usage_account_id = %(account)s)
        AND (%(service)s = 'all' OR service = %(service)s)
        AND (%(region)s = 'all' OR region = %(region)s)
)
SELECT 
    category,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM category_mapping
GROUP BY category
ORDER BY total_cost DESC;
"""


# ============================================================
# 5. COST BY REGION
# ============================================================

REGION_BREAKDOWN_QUERY = """
SELECT 
    region,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(service)s = 'all' OR service = %(service)s)
GROUP BY region
ORDER BY total_cost DESC;
"""


# ============================================================
# 6. COST BY INSTANCE TYPE
# ============================================================

INSTANCE_BREAKDOWN_QUERY = """
SELECT 
    instance_type,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND instance_type IS NOT NULL
    AND instance_type != ''
GROUP BY instance_type
ORDER BY total_cost DESC
LIMIT 10;
"""


# ============================================================
# 7. DATA TRANSFER (In / Out / VPC)
# ============================================================

DATA_TRANSFER_QUERY = """
SELECT 
    TO_CHAR(DATE_TRUNC('month', usage_start), 'YYYY-MM') AS month,
    ROUND(SUM(CASE WHEN service = 'Amazon VPC' AND usage_type LIKE '%DataTransfer-Out-Bytes%' THEN cost ELSE 0 END)::numeric, 2) AS outbound,
    ROUND(SUM(CASE WHEN service = 'Amazon VPC' AND usage_type LIKE '%DataTransfer-In-Bytes%' THEN cost ELSE 0 END)::numeric, 2) AS inbound,
    ROUND(SUM(CASE WHEN service = 'Amazon VPC' AND usage_type LIKE '%VPC%' THEN cost ELSE 0 END)::numeric, 2) AS vpc
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
GROUP BY DATE_TRUNC('month', usage_start)
ORDER BY month ASC
LIMIT 12;
"""


# ============================================================
# 8. SAVINGS PLANS COVERAGE
# ============================================================

SAVINGS_PLANS_QUERY = """
WITH total_spend AS (
    SELECT 
        SUM(cost) AS total_cost
    FROM billing_records
    WHERE 
        usage_start >= %(start_date)s::date
        AND usage_start <= %(end_date)s::date
        AND (%(account)s = 'all' OR usage_account_id = %(account)s)
        AND (%(service)s = 'all' OR service = %(service)s)
        AND (%(region)s = 'all' OR region = %(region)s)
),
savings_spend AS (
    SELECT 
        SUM(cost) AS savings_cost
    FROM billing_records
    WHERE 
        usage_start >= %(start_date)s::date
        AND usage_start <= %(end_date)s::date
        AND (%(account)s = 'all' OR usage_account_id = %(account)s)
        AND (%(service)s = 'all' OR service = %(service)s)
        AND (%(region)s = 'all' OR region = %(region)s)
        AND pricing_term = 'Savings Plan'
)
SELECT 
    ROUND((COALESCE(savings_spend.savings_cost, 0) / NULLIF(total_spend.total_cost, 0)) * 100, 2) AS coverage_percent,
    ROUND(COALESCE(savings_spend.savings_cost, 0)::numeric, 2) AS savings_amount,
    ROUND(COALESCE(total_spend.total_cost, 0)::numeric, 2) AS total_amount
FROM total_spend, savings_spend;
"""


# ============================================================
# 9. TOP ACCOUNTS
# ============================================================

TOP_ACCOUNTS_QUERY = """
SELECT 
    usage_account_id AS account,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(service)s = 'all' OR service = %(service)s)
    AND (%(region)s = 'all' OR region = %(region)s)
GROUP BY usage_account_id
ORDER BY total_cost DESC
LIMIT 10;
"""


# ============================================================
# 10. TOP 10 SERVICES
# ============================================================

TOP_10_SERVICES_QUERY = """
SELECT 
    service,
    ROUND(SUM(cost)::numeric, 2) AS total_cost
FROM billing_records
WHERE 
    usage_start >= %(start_date)s::date
    AND usage_start <= %(end_date)s::date
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(region)s = 'all' OR region = %(region)s)
GROUP BY service
ORDER BY total_cost DESC
LIMIT 10;
"""


# ============================================================
# 11. HOURLY TREND (Last 24 Hours)
# ============================================================

HOURLY_TREND_QUERY = """
SELECT 
    TO_CHAR(DATE_TRUNC('hour', usage_start), 'HH24:00') AS hour,
    ROUND(SUM(cost)::numeric, 2) AS cost
FROM billing_records
WHERE 
    usage_start >= NOW() - INTERVAL '24 hours'
    AND usage_start <= NOW()
    AND (%(account)s = 'all' OR usage_account_id = %(account)s)
    AND (%(service)s = 'all' OR service = %(service)s)
    AND (%(region)s = 'all' OR region = %(region)s)
GROUP BY DATE_TRUNC('hour', usage_start)
ORDER BY hour ASC;
"""