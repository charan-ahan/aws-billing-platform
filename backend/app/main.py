from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.billing import router as billing_router
from backend.app.api.chatbot import router as chatbot_router

app = FastAPI(
    title="AWS Billing Analytics Platform API",
    description="Backend API for AWS Billing Analytics Platform",
    version="1.0.0"
)

# ----- CORS Configuration -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(billing_router)
app.include_router(chatbot_router)

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "AWS Billing Analytics Platform API"
    }