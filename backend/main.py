from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
import logging

# Import Database connection, models, and schemas
from database import engine, Base, get_db
import models
import schemas

# Configure server logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("expense_tracker")

# Create database tables automatically in PostgreSQL if they don't exist yet
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Could not connect to PostgreSQL on startup: {e}")

# Initialize FastAPI application
app = FastAPI(
    title="Daily Expense Tracker API",
    description="A REST API powered by FastAPI, SQLAlchemy, and PostgreSQL.",
    version="2.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CUSTOM EXCEPTION HANDLERS (ERROR HANDLING)
# ==========================================

# 1. Pydantic Validation Error Handler (HTTP 422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first_err = errors[0]
        err_msg = first_err.get("msg", "Invalid input data provided.")
        if err_msg.startswith("Value error, "):
            err_msg = err_msg.replace("Value error, ", "")
    else:
        err_msg = "Invalid input data provided."

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": err_msg}
    )


# 2. Database Error Handler (HTTP 500) - Prevents sensitive DB info leak
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database Error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please ensure your PostgreSQL server is running."}
    )


# 3. Generic Server Error Handler (HTTP 500)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected Error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again later."}
    )


# Root Endpoint
@app.get("/", tags=["Health Check"])
def root():
    return {"message": "Welcome to the Daily Expense Tracker API (PostgreSQL Edition)!"}


# ==========================================
# API ENDPOINTS USING POSTGRESQL & SQLALCHEMY
# ==========================================

# 1. CREATE A NEW EXPENSE (POST /expenses)
@app.post("/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(
        amount=expense.amount,
        category=expense.category,
        date=expense.date,
        description=expense.description
    )

    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    return db_expense


# 2. GET ALL EXPENSES (GET /expenses)
@app.get("/expenses", response_model=List[schemas.ExpenseResponse], tags=["Expenses"])
def get_all_expenses(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    return expenses


# 3. GET SINGLE EXPENSE BY ID (GET /expenses/{expense_id})
@app.get("/expenses/{expense_id}", response_model=schemas.ExpenseResponse, tags=["Expenses"])
def get_expense_by_id(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found."
        )
    return expense


# 4. UPDATE AN EXPENSE BY ID (PUT /expenses/{expense_id})
@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse, tags=["Expenses"])
def update_expense(expense_id: int, updated_data: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found."
        )

    if updated_data.amount is not None:
        expense.amount = updated_data.amount
    if updated_data.category is not None:
        expense.category = updated_data.category
    if updated_data.date is not None:
        expense.date = updated_data.date
    if updated_data.description is not None:
        expense.description = updated_data.description

    db.commit()
    db.refresh(expense)

    return expense


# 5. DELETE AN EXPENSE BY ID (DELETE /expenses/{expense_id})
@app.delete("/expenses/{expense_id}", tags=["Expenses"])
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found."
        )

    db.delete(expense)
    db.commit()

    return {"message": f"Expense with ID {expense_id} deleted successfully."}
