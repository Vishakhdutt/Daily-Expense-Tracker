import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env file
load_dotenv()

# Get PostgreSQL database URL from environment variable
# Fallback to default local connection string if not defined in .env
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:Anmol%401234@localhost:5432/daily_expense_tracker"
)

# Create SQLAlchemy engine to connect to PostgreSQL database
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class to handle database sessions per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our SQLAlchemy database models
Base = declarative_base()

# FastAPI Dependency to get a database session for each endpoint request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
