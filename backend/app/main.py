from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- ADD THIS IMPORT
from backend.app.api.billing import router as billing_router
from backend.app.api.chatbot import router as chatbot_router

app = FastAPI(
    title="AWS Billing Analytics Platform API",
    description="Backend API for AWS Billing Analytics Platform",
    version="1.0.0"
)

# ----- CORS Configuration -----
# List of allowed origins (your frontend domains)
origins = [
    "https://billing-analytics-dashboard.onrender.com",  # Your live frontend
    # Add localhost if needed for testing:
    # "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # Allow these origins
    allow_credentials=True,
    allow_methods=["*"],             # Allow all HTTP methods
    allow_headers=["*"],             # Allow all headers
)
# ------------------------------

# Include routers
app.include_router(billing_router)
app.include_router(chatbot_router)

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "AWS Billing Analytics Platform API"
    }