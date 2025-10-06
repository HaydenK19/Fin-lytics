from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import User_Transactions, Transaction_Category_Link, Users
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/entered_transactions",
    tags=["Entered Transactions"]
)

# ==================== Dependencies ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

# ==================== Schemas ====================
class UserTransactionCreate(BaseModel):
    user_id: int
    date: str
    amount: float
    description: str | None = None
    category_id: int

class UserTransactionUpdate(BaseModel):
    date: str | None = None
    amount: float | None = None
    description: str | None = None
    category_id: int | None = None

# ==================== Routes ====================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_user_transaction(
    data: UserTransactionCreate,
    user: user_dependency,
    db: db_dependency
):
    """Create a new user-entered transaction"""
    try:
        # Verify the user is creating a transaction for themselves
        if user["id"] != data.user_id:
            raise HTTPException(status_code=403, detail="Cannot create transaction for another user")
        
        new_transaction = User_Transactions(
            user_id=data.user_id,
            date=data.date,
            amount=data.amount,
            description=data.description,
            category_id=data.category_id
        )
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        # Create User_Transaction_Category_Link
        from models import User_Transaction_Category_Link
        new_link = User_Transaction_Category_Link(
            transaction_id=new_transaction.transaction_id,
            category_id=data.category_id
        )
        db.add(new_link)
        db.commit()

        return new_transaction.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating transaction: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK)
async def get_user_transactions(
    user: user_dependency,
    db: db_dependency
):
    """Get all user-entered transactions for the authenticated user"""
    try:
        transactions = db.query(User_Transactions).filter(User_Transactions.user_id == user["id"]).all()
        return [transaction.to_dict() for transaction in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")

@router.get("/combined", status_code=status.HTTP_200_OK)
async def get_combined_transactions(
    user: user_dependency,
    db: db_dependency
):
    """Get both Plaid and user-entered transactions for the authenticated user"""
    try:
        # Get user-entered transactions
        user_transactions = db.query(User_Transactions).filter(User_Transactions.user_id == user["id"]).all()
        user_transactions_data = [transaction.to_dict() for transaction in user_transactions]
        for transaction in user_transactions_data:
            transaction["source"] = "user_entered"

        # Get Plaid transactions if available
        plaid_transactions_data = []
        try:
            from models import Plaid_Transactions, Plaid_Bank_Account
            db_user = db.query(Users).filter(Users.id == user["id"]).first()
            if db_user and db_user.plaid_access_token:
                db_transactions = db.query(Plaid_Transactions).filter(
                    Plaid_Transactions.account_id.in_(
                        db.query(Plaid_Bank_Account.account_id).filter(
                            Plaid_Bank_Account.user_id == user["id"]
                        )
                    )
                ).all()
                for t in db_transactions:
                    plaid_tx = {
                        "transaction_id": t.transaction_id,
                        "account_id": t.account_id,
                        "amount": t.amount,
                        "currency": t.currency,
                        "category": t.category,
                        "merchant_name": t.merchant_name,
                        "date": t.date.isoformat() if t.date else None,
                        "source": "plaid"
                    }
                    plaid_transactions_data.append(plaid_tx)
        except Exception as plaid_error:
            print(f"Plaid transactions not available: {plaid_error}")

        # Combine and sort by date
        all_transactions = user_transactions_data + plaid_transactions_data
        all_transactions.sort(key=lambda x: x.get("date", ""), reverse=True)

        return {
            "user_transactions": user_transactions_data,
            "plaid_transactions": plaid_transactions_data,
            "all_transactions": all_transactions
        }
    except Exception as e:
        import traceback
        print("Error in get_combined_transactions:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching combined transactions: {str(e)}")

@router.put("/{transaction_id}", status_code=status.HTTP_200_OK)
async def update_user_transaction(
    transaction_id: int,
    data: UserTransactionUpdate,
    user: user_dependency,
    db: db_dependency
):
    """Update a user-entered transaction"""
    try:
        transaction = db.query(User_Transactions).filter(
            User_Transactions.transaction_id == transaction_id,
            User_Transactions.user_id == user["id"] 
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if data.date is not None:
            transaction.date = data.date
        if data.amount is not None:
            transaction.amount = data.amount
        if data.description is not None:
            transaction.description = data.description
        if data.category_id is not None:
            transaction.category_id = data.category_id
            # Update Transaction_Category_Link
            link = db.query(Transaction_Category_Link).filter(
                Transaction_Category_Link.transaction_id == str(transaction_id)
            ).first()
            if link:
                link.category_id = data.category_id
            else:
                # If link doesn't exist, create it
                new_link = Transaction_Category_Link(
                    transaction_id=str(transaction_id),
                    category_id=data.category_id
                )
                db.add(new_link)
        db.commit()
        db.refresh(transaction)
        return transaction.to_dict()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating transaction: {str(e)}")

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_transaction(
    transaction_id: int,
    user: user_dependency,
    db: db_dependency
):
    """Delete a user-entered transaction"""
    try:
        transaction = db.query(User_Transactions).filter(
            User_Transactions.transaction_id == transaction_id,
            User_Transactions.user_id == user["id"]
        ).first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        # Delete Transaction_Category_Links first
        links = db.query(Transaction_Category_Link).filter(
            Transaction_Category_Link.transaction_id == str(transaction_id)
        ).all()
        for link in links:
            db.delete(link)
        db.delete(transaction)
        db.commit()
        return None
    except Exception as e:
        import traceback
        print("Error deleting transaction:", traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting transaction: {str(e)}")
