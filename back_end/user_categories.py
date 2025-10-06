
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal
from pydantic import BaseModel
from models import User_Categories, Users

class UserCategoryCreate(BaseModel):
    user_id: int
    name: str
    weekly_limit: float | None = None
    color: str | None = None

class UserCategoryUpdate(BaseModel):
    name: str
    weekly_limit: float | None = None
    color: str | None = None

router = APIRouter(
    prefix="/user_categories",
    tags=["user_categories"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]



@router.get("/{user_id}/weekly_spent", status_code=200)
async def get_weekly_spent_per_category(user_id: int, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    from models import User_Transactions, User_Transaction_Category_Link, Plaid_Transactions, Transaction_Category_Link

    categories = get_user_categories(user_id, db)
    one_week_ago = datetime.now() - timedelta(days=7)
    result = []
    for category in categories:
        # User transactions
        user_transactions = db.query(User_Transactions).join(User_Transaction_Category_Link).filter(
            User_Transaction_Category_Link.category_id == category["id"],
            User_Transactions.user_id == user_id,
            User_Transactions.date >= one_week_ago.date()
        ).all()
        user_total = sum(abs(tx.amount) for tx in user_transactions)

        # Plaid transactions
        plaid_transactions = db.query(Plaid_Transactions).join(Transaction_Category_Link).filter(
            Transaction_Category_Link.category_id == category["id"],
            Plaid_Transactions.date >= one_week_ago.date()
        ).all()
        plaid_total = sum(abs(tx.amount) for tx in plaid_transactions)

        result.append({
            "category_id": category["id"],
            "category_name": category["name"],
            "weekly_limit": category["weekly_limit"],
            "amount_spent": user_total + plaid_total,
            "amount_remaining": (category["weekly_limit"] or 0) - (user_total + plaid_total)
        })
    return result



# ==================== Logic ====================
def get_user_categories(user_id: int, db: Session):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    categories = db.query(User_Categories).filter(User_Categories.user_id == user_id).all()
    return [
        {"id": cat.id, "name": cat.name, "color": cat.color, "weekly_limit": cat.weekly_limit}
        for cat in categories
    ]

def create_user_category(user_id: int, data: UserCategoryCreate, db: Session):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(User_Categories).filter(
        User_Categories.user_id == user_id, User_Categories.name == data.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")

    new_category = User_Categories(
        user_id=user_id,
        name=data.name,
        color=data.color,
        weekly_limit=data.weekly_limit
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category

def update_user_category(category_id: int, data: UserCategoryUpdate, db: Session):
    category = db.query(User_Categories).filter(User_Categories.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing = db.query(User_Categories).filter(
        User_Categories.user_id == category.user_id, 
        User_Categories.name == data.name
    ).first()

    if existing and existing.id != category_id:
        raise HTTPException(status_code=400, detail="Category name already exists for the user")

    category.name = data.name
    category.color = data.color
    category.weekly_limit = data.weekly_limit

    db.commit()
    db.refresh(category)

    return {
        "message": "Category updated successfully",
        "id": category.id,
        "name": category.name,
        "color": category.color,
        "weekly_limit": category.weekly_limit
    }

def delete_user_category(category_id: int, db: Session):
    category = db.query(User_Categories).filter(User_Categories.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# ==================== Routes ====================
@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get(user_id: int, db: Session = Depends(get_db)):
    return get_user_categories(user_id, db)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(data: UserCategoryCreate, db: Session = Depends(get_db)):
    return create_user_category(data.user_id, data, db)

@router.put("/{category_id}", status_code=status.HTTP_200_OK)
async def update(category_id: int, data: UserCategoryUpdate, db: Session = Depends(get_db)):
    return update_user_category(category_id, data, db)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(category_id: int, db: Session = Depends(get_db)):
    return delete_user_category(category_id, db)
