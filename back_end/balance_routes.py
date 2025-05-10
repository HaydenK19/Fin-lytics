from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import Users, User_Balance
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/balances",
    tags=["Balances"]
)

# ==================== Dependencies ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== Schemas ====================
class BalanceUpdate(BaseModel):
    balance_name: str
    new_amount: float

# ==================== Routes ====================
@router.put("/update", status_code=status.HTTP_200_OK)
async def update_balance(
    update_data: BalanceUpdate,
    user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update a user's balance amount and save the previous balance.
    """
    # Find the balance record for this user and balance type
    balance = db.query(User_Balance).filter(
        User_Balance.id == user["id"],
        User_Balance.balance_name == update_data.balance_name
    ).first()

    if not balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Balance of type {update_data.balance_name} not found for user"
        )

    # Save current balance as previous balance
    balance.previous_balance = balance.balance_amount
    # Update to new balance
    balance.balance_amount = update_data.new_amount
    # Update the balance date
    balance.balance_date = datetime.utcnow()

    db.commit()
    db.refresh(balance)

    return {
        "message": "Balance updated successfully",
        "balance_name": balance.balance_name,
        "new_amount": balance.balance_amount,
        "previous_balance": balance.previous_balance,
        "balance_date": balance.balance_date
    }

@router.get("/", status_code=status.HTTP_200_OK)
async def get_balances(
    user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Get all balances for the current user.
    """
    balances = db.query(User_Balance).filter(User_Balance.id == user["id"]).all()
    
    return [
        {
            "balance_name": balance.balance_name,
            "balance_amount": balance.balance_amount,
            "previous_balance": balance.previous_balance,
            "balance_date": balance.balance_date
        }
        for balance in balances
    ] 