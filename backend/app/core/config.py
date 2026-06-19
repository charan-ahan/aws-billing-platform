from pathlib import Path

# Root of the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SQLite database location
DATABASE_URL = f"sqlite:///{BASE_DIR}/billing.db"