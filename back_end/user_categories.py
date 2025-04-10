from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import User_Categories, Users, Transaction_Category_Link
from pydantic import BaseModel

router = APIRouter(
    prefix='/user_categories',
    tags=['user_categories']
)

# Database session dependency
def get_db():
    """
    Creates a new database session for the request and ensures it is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

class UserCategoryCreate(BaseModel):
    """
    Schema for creating or updating a user category.
    """
    name: str
    color: str
    weekly_limit: float | None = None

class UserCategoryUpdate(BaseModel):
    """
    Schema for updating a user category.
    """
    name: str
    color: str
    weekly_limit: float | None = None

@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_categories(user_id: int, db: db_dependency):
    """
    Retrieves the user categories for a specific user.

    - **Returns:**
      - A list of user categories associated with the given `user_id`.
    """
    user_record = db.query(Users).filter(Users.id == user_id).first()

    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")

    categories = db.query(User_Categories).filter(User_Categories.user_id == user_id).all()

    return [{"id": category.id, "name": category.name, "color": category.color, "weekly_limit": category.weekly_limit} for category in categories]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user_category(
    user_id: int, 
    category_create: UserCategoryCreate,
    db: db_dependency
):
    """
    Creates a new user category.

    - **Validations:**
      - Ensures the user exists
      - Ensures the category name is unique for the user

    - **Returns:**
      - A success message along with the created user category
    """
    user_record = db.query(Users).filter(Users.id == user_id).first()

    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the category name already exists for the user
    existing_category = db.query(User_Categories).filter(User_Categories.user_id == user_id, User_Categories.name == category_create.name).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category name already exists")

    new_category = User_Categories(
        user_id=user_id,
        name=category_create.name,
        color=category_create.color,
        weekly_limit=category_create.weekly_limit
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "message": "Category created successfully",
        "id": new_category.id,
        "name": new_category.name,
        "color": new_category.color,
        "weekly_limit": new_category.weekly_limit
    }

@router.put("/{category_id}", status_code=status.HTTP_200_OK)
async def update_user_category(
    category_id: int,
    category_update: UserCategoryUpdate,
    db: db_dependency
):
    """
    Updates a user category.

    - **Validations:**
      - Ensures the category exists for the user
      - Ensures the category name is unique for the user

    - **Returns:**
      - A success message along with the updated user category
    """
    category_record = db.query(User_Categories).filter(User_Categories.id == category_id).first()

    if not category_record:
        raise HTTPException(status_code=404, detail="Category not found")

    existing_category = db.query(User_Categories).filter(User_Categories.user_id == category_record.user_id, User_Categories.name == category_update.name).first()
    if existing_category and existing_category.id != category_id:
        raise HTTPException(status_code=400, detail="Category name already exists for the user")

    # Apply updates
    category_record.name = category_update.name
    category_record.color = category_update.color
    category_record.weekly_limit = category_update.weekly_limit
    
    db.commit()
    db.refresh(category_record)

    return {
        "message": "Category updated successfully",
        "id": category_record.id,
        "name": category_record.name,
        "color": category_record.color,
        "weekly_limit": category_record.weekly_limit
    }

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_category(
    category_id: int, 
    db: db_dependency
):
    """
    Deletes a user category by ID.

    - **Validations:**
      - Ensures the category exists

    - **Returns:**
      - A 204 status code (No Content) upon successful deletion
    """
    category_record = db.query(User_Categories).filter(User_Categories.id == category_id).first()

    if not category_record:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category_record)
    db.commit()

    return {"message": "Category deleted successfully"}
