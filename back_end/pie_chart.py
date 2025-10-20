from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import Plaid_Transactions, User_Categories, Users, Transaction_Category_Link, Plaid_Bank_Account
from pydantic import BaseModel
from user_categories import get_user_categories

router = APIRouter(
    prefix='/pie_chart',
    tags=['pie_chart']
)

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# Gets the sum of expenses per category
def get_total_expenses_per_category(user_id: int, db: Session):
    categories = get_user_categories(user_id, db)
    category_expenses = {}

    for category in categories:
        # Get all transactions for this user's accounts that are linked to this category
        # Join Plaid_Transactions -> Plaid_Bank_Account -> User, and filter by category
        transactions = db.query(Plaid_Transactions).join(
            Plaid_Bank_Account, 
            Plaid_Transactions.account_id == Plaid_Bank_Account.account_id
        ).join(
            Transaction_Category_Link,
            Plaid_Transactions.transaction_id == Transaction_Category_Link.transaction_id
        ).filter(
            Plaid_Bank_Account.user_id == user_id,
            Transaction_Category_Link.category_id == category["id"]
        ).all()
        
        # Calculate total expenses (use absolute value for expenses)
        total = sum(abs(transaction.amount) for transaction in transactions)
        category_expenses[category["name"]] = total

    return category_expenses

# Routes
@router.get("/")
async def get_pie_chart_default():
    """
    Returns an error message when no user_id is provided.
    """
    raise HTTPException(status_code=400, detail="user_id is required")

@router.get("/{user_id}")
async def get_pie_chart_data_as_json(user_id: int, db: Annotated[Session, Depends(get_db)]):
    """
    Returns the pie chart data as a JSON string with total expenses per category.
    """
    return get_total_expenses_per_category(user_id, db)
