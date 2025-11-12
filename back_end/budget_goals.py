from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional
from database import SessionLocal
from models import Budget_Goals
from pydantic import BaseModel
from datetime import datetime
from auth import get_current_user

router = APIRouter(
    prefix="/budget-goals", 
    tags=["budget_goals"]
)

# ==================== Dependencies ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# ==================== Schemas ====================
class CreateBudgetGoalRequest(BaseModel):
    goal_type: str  # 'annual' or 'category'
    goal_name: str
    goal_amount: float
    time_period: Optional[str] = None  # 'monthly' for categories, 'yearly' for annual
    category_name: Optional[str] = None  # for category-based goals

class UpdateBudgetGoalRequest(BaseModel):
    goal_name: Optional[str] = None
    goal_amount: Optional[float] = None
    time_period: Optional[str] = None
    category_name: Optional[str] = None
    is_active: Optional[bool] = None

class BudgetGoalResponse(BaseModel):
    id: int
    goal_type: str
    goal_name: str
    goal_amount: float
    time_period: Optional[str]
    category_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# ==================== Routes ====================

@router.get("/", response_model=List[BudgetGoalResponse])
async def get_budget_goals(user: Annotated[dict, Depends(get_current_user)], 
                          db: db_dependency,
                          goal_type: Optional[str] = None):
    """Get all budget goals for the current user, optionally filtered by goal_type."""
    query = db.query(Budget_Goals).filter(Budget_Goals.user_id == user["id"], Budget_Goals.is_active == True)
    
    if goal_type:
        query = query.filter(Budget_Goals.goal_type == goal_type)
    
    goals = query.all()
    return goals

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=BudgetGoalResponse)
async def create_budget_goal(user: Annotated[dict, Depends(get_current_user)], 
                           db: db_dependency, 
                           goal_request: CreateBudgetGoalRequest):
    """Create a new budget goal."""
    
    # Validate goal_type
    if goal_request.goal_type not in ['annual', 'category']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="goal_type must be either 'annual' or 'category'"
        )
    
    # For category goals, ensure category_name is provided
    if goal_request.goal_type == 'category' and not goal_request.category_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="category_name is required for category goals"
        )
    
    # Check if a goal with the same name already exists for this user
    existing_goal = db.query(Budget_Goals).filter(
        Budget_Goals.user_id == user["id"],
        Budget_Goals.goal_name == goal_request.goal_name,
        Budget_Goals.is_active == True
    ).first()
    
    if existing_goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A goal with this name already exists"
        )
    
    budget_goal_model = Budget_Goals(
        user_id=user["id"],
        goal_type=goal_request.goal_type,
        goal_name=goal_request.goal_name,
        goal_amount=goal_request.goal_amount,
        time_period=goal_request.time_period or ('monthly' if goal_request.goal_type == 'category' else 'yearly'),
        category_name=goal_request.category_name
    )
    
    db.add(budget_goal_model)
    db.commit()
    db.refresh(budget_goal_model)
    
    return budget_goal_model

@router.put("/{goal_id}", response_model=BudgetGoalResponse)
async def update_budget_goal(goal_id: int,
                           user: Annotated[dict, Depends(get_current_user)], 
                           db: db_dependency, 
                           goal_request: UpdateBudgetGoalRequest):
    """Update an existing budget goal."""
    
    goal = db.query(Budget_Goals).filter(
        Budget_Goals.id == goal_id,
        Budget_Goals.user_id == user["id"]
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget goal not found"
        )
    
    # Update fields if provided
    if goal_request.goal_name is not None:
        goal.goal_name = goal_request.goal_name
    if goal_request.goal_amount is not None:
        goal.goal_amount = goal_request.goal_amount
    if goal_request.time_period is not None:
        goal.time_period = goal_request.time_period
    if goal_request.category_name is not None:
        goal.category_name = goal_request.category_name
    if goal_request.is_active is not None:
        goal.is_active = goal_request.is_active
    
    goal.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(goal)
    
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget_goal(goal_id: int,
                           user: Annotated[dict, Depends(get_current_user)], 
                           db: db_dependency):
    """Delete a budget goal (soft delete by setting is_active to False)."""
    
    goal = db.query(Budget_Goals).filter(
        Budget_Goals.id == goal_id,
        Budget_Goals.user_id == user["id"]
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget goal not found"
        )
    
    goal.is_active = False
    goal.updated_at = datetime.utcnow()
    
    db.commit()

@router.post("/initialize_defaults", status_code=status.HTTP_201_CREATED)
async def initialize_default_categories(user: Annotated[dict, Depends(get_current_user)], 
                                      db: db_dependency):
    """Initialize default category budget goals for a new user."""
    
    # Check if user already has category goals
    existing_goals = db.query(Budget_Goals).filter(
        Budget_Goals.user_id == user["id"],
        Budget_Goals.goal_type == "category",
        Budget_Goals.is_active == True
    ).count()
    
    if existing_goals > 0:
        return {"message": "User already has category goals"}
    
    # Default categories with reasonable monthly budgets
    default_categories = [
        {"name": "Food & Dining", "amount": 500.0},
        {"name": "Entertainment", "amount": 200.0},
        {"name": "Transportation", "amount": 300.0},
        {"name": "Utilities", "amount": 150.0},
        {"name": "Healthcare", "amount": 100.0},
        {"name": "Shopping", "amount": 250.0},
    ]
    
    goals_created = []
    for category in default_categories:
        budget_goal = Budget_Goals(
            user_id=user["id"],
            goal_type="category",
            goal_name=f"{category['name']} Budget",
            goal_amount=category["amount"],
            time_period="monthly",
            category_name=category["name"]
        )
        db.add(budget_goal)
        goals_created.append(budget_goal)
    
    db.commit()
    
    for goal in goals_created:
        db.refresh(goal)
    
    return {"message": f"Created {len(goals_created)} default category goals", "goals": goals_created}