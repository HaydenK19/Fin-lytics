"""
Fullstack FastAPI app for Railway deployment - Dev branch version
Serves both backend API and React frontend, connects to HF Spaces for AI predictions
"""
import os
import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Annotated
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import backend modules with error handling
try:
    import models
    from database import SessionLocal, engine
    from auth import get_current_user
    logger.info("✅ Core modules loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load core modules: {e}")

# Import route modules with individual error handling
route_modules = {}

def safe_import(module_name):
    try:
        module = __import__(module_name)
        route_modules[module_name] = module
        logger.info(f"✅ {module_name} loaded")
        return module
    except Exception as e:
        logger.error(f"❌ Failed to load {module_name}: {e}")
        return None

# Try to import each route module
auth_module = safe_import("auth")
user_info_module = safe_import("user_info")
user_settings_module = safe_import("user_settings") 
user_categories_module = safe_import("user_categories")
stock_routes_module = safe_import("stock_routes")
overview_routes_module = safe_import("overview_routes")
pie_chart_module = safe_import("pie_chart")
user_balances_module = safe_import("user_balances")
user_transactions_module = safe_import("user_transactions")
entered_transactions_module = safe_import("entered_transactions")
balance_routes_module = safe_import("balance_routes")
budget_goals_module = safe_import("budget_goals")
stripe_routes_module = safe_import("stripe_routes")
plaid_routes_module = safe_import("plaid_routes")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    try:
        # Create database tables if models are available
        if 'models' in globals():
            models.Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
        else:
            logger.warning("⚠️ Models not available - skipping database setup")
        
        logger.info("✅ Fullstack application initialized for Railway - Dev branch")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        # Don't fail startup - continue with limited functionality
    
    yield
    
    # Shutdown
    try:
        logger.info("🔄 Shutting down fullstack application")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")

app = FastAPI(
    title="Finlytics Full-Stack Application - Dev Branch",
    description="Complete Finlytics app from dev branch with React frontend and FastAPI backend for Railway",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for database sessions
def get_db():
    try:
        if 'SessionLocal' in globals():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()
        else:
            logger.warning("⚠️ Database not available")
            yield None
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        yield None

# Health check endpoint (must work for Railway deployment)
@app.get("/api/health")
async def health_check():
    loaded_modules = [name for name, module in route_modules.items() if module is not None]
    
    return {
        "status": "healthy",
        "service": "finlytics-fullstack-dev",
        "environment": "railway",
        "branch": "dev",
        "loaded_modules": loaded_modules,
        "total_modules_loaded": len(loaded_modules),
        "database_available": 'SessionLocal' in globals()
    }

# Debug endpoints for Railway login troubleshooting
@app.get("/api/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables (remove in production)"""
    return {
        "database_url": bool(os.getenv("DATABASE_URL")),
        "secret_key": bool(os.getenv("SECRET_KEY")),
        "plaid_client_id": bool(os.getenv("PLAID_CLIENT_ID")),
        "stripe_secret": bool(os.getenv("STRIPE_SECRET_KEY")),
        "environment_count": len([k for k in os.environ.keys() if not k.startswith("_")])
    }

@app.get("/api/debug/database")
async def debug_database(db: Session = Depends(get_db)):
    """Debug endpoint to test database connectivity"""
    try:
        if db is None:
            return {"status": "error", "message": "Database connection failed"}
        
        # Test a simple query
        result = db.execute("SELECT 1 as test").fetchone()
        return {
            "status": "success", 
            "message": "Database connected",
            "test_query": result[0] if result else None
        }
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}

@app.get("/api/debug/user/{username}")
async def debug_user(username: str, db: Session = Depends(get_db)):
    """Debug endpoint to check if user exists"""
    try:
        if db is None:
            return {"status": "error", "message": "Database not available"}
        
        if 'models' not in globals():
            return {"status": "error", "message": "Models not loaded"}
        
        from models import Users
        user = db.query(Users).filter(Users.username == username).first()
        
        if user:
            return {
                "exists": True,
                "username": user.username,
                "email": user.email,
                "is_verified": user.is_verified,
                "created_at": str(user.created_at) if hasattr(user, 'created_at') else None,
                "has_password": bool(user.hashed_password)
            }
        else:
            return {"exists": False, "message": f"User '{username}' not found"}
            
    except Exception as e:
        return {"status": "error", "message": f"User check error: {str(e)}"}

# Include API routes with error handling
def include_router_safe(module, router_name, prefix, tag):
    try:
        if module and hasattr(module, router_name):
            router = getattr(module, router_name)
            app.include_router(router, prefix=prefix, tags=[tag])
            logger.info(f"✅ {tag} routes loaded")
            return True
        else:
            logger.warning(f"⚠️ {tag} router not found in module")
            return False
    except Exception as e:
        logger.error(f"❌ Failed to load {tag} routes: {e}")
        return False

# Include routers for available modules
include_router_safe(auth_module, "router", "/api/auth", "Authentication")
include_router_safe(user_info_module, "router", "/api/user", "User")
include_router_safe(user_settings_module, "router", "/api/settings", "Settings")
include_router_safe(user_categories_module, "router", "/api/categories", "Categories")
include_router_safe(stock_routes_module, "router", "/api/stocks", "Stocks")
include_router_safe(overview_routes_module, "router", "/api/overview", "Overview")
include_router_safe(pie_chart_module, "router", "/api/charts", "Charts")
include_router_safe(user_balances_module, "router", "/api/balances", "Balances")
include_router_safe(user_transactions_module, "router", "/api/transactions", "Transactions")
include_router_safe(entered_transactions_module, "router", "/api/entered-transactions", "Entered Transactions")
include_router_safe(balance_routes_module, "router", "/api/account-balances", "Account Balances")
include_router_safe(budget_goals_module, "router", "/api/budget", "Budget Goals")
include_router_safe(stripe_routes_module, "router", "/api/stripe", "Stripe")
include_router_safe(plaid_routes_module, "router", "/api/plaid", "Plaid")

# Serve static files (React build)
static_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
logger.info(f"Looking for static files in: {static_dir}")

if os.path.exists(static_dir):
    # Mount static assets
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        logger.info(f"✅ Static assets mounted from {assets_dir}")
    
    # Check if index.html exists
    index_file = os.path.join(static_dir, "index.html")
    index_exists = os.path.exists(index_file)
    logger.info(f"Index file exists: {index_exists} at {index_file}")
    
    if index_exists:
        # Serve React app for root route
        @app.get("/")
        async def serve_root():
            logger.info("Serving React app for root route")
            return FileResponse(index_file)
        
        # Serve React app for all other non-API routes
        @app.get("/{full_path:path}")
        async def serve_react_app(full_path: str):
            # If it's an API route, let FastAPI handle it normally
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="API endpoint not found")
            
            # For all other routes, serve the React app
            logger.info(f"Serving React app for route: /{full_path}")
            return FileResponse(index_file)
    else:
        logger.error("❌ index.html not found in dist folder")
        @app.get("/")
        async def root_fallback():
            return {"message": "Finlytics Dev Branch Backend Running - Frontend files missing"}
            
        @app.get("/{full_path:path}")
        async def catch_all_fallback(full_path: str):
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="API endpoint not found")
            return {"message": "Frontend not available", "path": full_path, "branch": "dev"}
            
else:
    logger.error(f"❌ Static directory not found: {static_dir}")
    
    @app.get("/")
    async def root_no_frontend():
        return {"message": "Finlytics Dev Branch Backend Running - No frontend directory"}
    
    @app.get("/{full_path:path}")
    async def catch_all_no_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        return {"message": "No frontend available", "path": full_path, "branch": "dev"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)