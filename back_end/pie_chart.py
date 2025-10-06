from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import Plaid_Transactions, User_Categories, Users, Transaction_Category_Link
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

#Gets the sum of expenses per category
def get_total_expenses_per_category(user_id: int, db: Session):
    categories = get_user_categories(user_id, db)
    category_expenses = {}

    from models import User_Transactions, User_Transaction_Category_Link

    for category in categories:
        # Plaid transactions
        plaid_transactions = db.query(Plaid_Transactions).join(Transaction_Category_Link).filter(Transaction_Category_Link.category_id == category["id"]).all()
        plaid_total = sum(abs(transaction.amount) for transaction in plaid_transactions)

        # User transactions
        user_transactions = db.query(User_Transactions).join(User_Transaction_Category_Link).filter(User_Transaction_Category_Link.category_id == category["id"], User_Transactions.user_id == user_id).all()
        user_total = sum(abs(transaction.amount) for transaction in user_transactions)

        category_expenses[category["name"]] = plaid_total + user_total

    return category_expenses

# Routes
@router.get("/")
async def get_pie_chart_default():
    """
    Returns an error message when no user_id is provided.
    """
    raise HTTPException(status_code=400, detail="user_id is required")

@router.get("/{user_id}")
async def get_pie_chart_data_as_json(user_id: int, db: db_dependency):
    """
    Returns the pie chart data as a JSON string with total expenses per category.
    """
    return get_total_expenses_per_category(user_id, db)
