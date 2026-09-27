from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
import re

# Allowed list of categories for strict validation
ALLOWED_CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Education", "Health", "Other"]

# Schema for creating a new expense (Incoming Request Body)
class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    category: str = Field(..., description="Category is required (e.g. Food, Travel)")
    date: str = Field(..., description="Date is required (YYYY-MM-DD format)")
    description: str = Field(..., description="Expense description (1-200 characters)")

    @field_validator('category')
    @classmethod
    def validate_category(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Category must be selected.")
        stripped = value.strip()
        matched = next((c for c in ALLOWED_CATEGORIES if c.lower() == stripped.lower()), None)
        if not matched:
            raise ValueError(f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return matched

    @field_validator('date')
    @classmethod
    def validate_date(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Date is required.")
        stripped = value.strip()
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', stripped):
            raise ValueError("Date must be in YYYY-MM-DD format.")
        return stripped

    @field_validator('description')
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Description cannot be empty or blank.")
        stripped = value.strip()
        if len(stripped) > 200:
            raise ValueError("Description cannot exceed 200 characters.")
        return stripped


# Schema for updating an existing expense
class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="Amount must be greater than 0")
    category: Optional[str] = Field(None, description="Category of expense")
    date: Optional[str] = Field(None, description="Date of expense")
    description: Optional[str] = Field(None, description="Expense description")

    @field_validator('category')
    @classmethod
    def validate_category(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        matched = next((c for c in ALLOWED_CATEGORIES if c.lower() == stripped.lower()), None)
        if not matched:
            raise ValueError(f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}")
        return matched

    @field_validator('date')
    @classmethod
    def validate_date(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', stripped):
            raise ValueError("Date must be in YYYY-MM-DD format.")
        return stripped

    @field_validator('description')
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if len(stripped) == 0:
            raise ValueError("Description cannot be empty or blank.")
        if len(stripped) > 200:
            raise ValueError("Description cannot exceed 200 characters.")
        return stripped


# Schema for sending expense data back to client (Outgoing Response)
class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    date: str
    description: Optional[str] = None

    # Allows Pydantic to automatically convert SQLAlchemy ORM model objects into JSON responses
    model_config = ConfigDict(from_attributes=True)
