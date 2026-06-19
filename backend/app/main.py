from fastapi import FastAPI

from backend.app.api.billing import router as billing_router

app = FastAPI(
    title="AWS Billing Analytics Platform",
    description="Backend API for AWS Billing Analytics",
    version="1.0.0",
)

app.include_router(billing_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "message": "AWS Billing Analytics Platform API",
    }