from backend.app.database.base import Base
from backend.app.database.database import engine


def init_database():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_database()
    print("Database initialized successfully.")