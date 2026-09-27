from sqlalchemy import Column, Integer, Float, String
from database import Base

class Expense(Base):
    """
    SQLAlchemy Model representing the 'expenses' table in PostgreSQL.
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(String, nullable=False)
    description = Column(String, nullable=True)
