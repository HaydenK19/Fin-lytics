#!/usr/bin/env python3
"""
Simplified FastAPI main.py for Railway deployment with better error handling
"""
import os
import sys
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Finlytics API",
    description="Personal Finance Management API",
    version="1.0.0"
)

# Configure CORS
origins = [
    "https://localhost:5173",
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://fin-lytics.com",
    "https://www.fin-lytics.com",
    "https://*.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (required by Railway)
@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment"""
    return {
        "status": "healthy",
        "service": "finlytics-backend",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "unknown")
    }

# Basic root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Finlytics API is running!",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Import and include routes with error handling
def setup_routes():
    """Setup all API routes with error handling"""
    try:
        logger.info("Setting up API routes...")
        
        # Import routes with individual error handling
        routes_to_load = [
            ("auth", "Authentication routes"),
            ("plaid_routes", "Plaid integration routes"),
            ("user_info", "User information routes"),
            ("user_settings", "User settings routes"), 
            ("user_categories", "User categories routes"),
            ("stock_routes", "Stock data routes"),
            ("pie_chart", "Chart routes"),
            ("user_balances", "User balance routes"),
            ("user_transactions", "Transaction routes"),
            ("entered_transactions", "Manual transaction routes"),
            ("balance_routes", "Balance calculation routes")
        ]
        
        for module_name, description in routes_to_load:
            try:
                module = __import__(module_name)
                if hasattr(module, 'router'):
                    app.include_router(module.router)
                    logger.info(f"✅ Loaded {description}")
                else:
                    logger.warning(f"⚠️  Module {module_name} has no router attribute")
            except ImportError as e:
                logger.error(f"❌ Failed to import {module_name}: {e}")
            except Exception as e:
                logger.error(f"💥 Error loading {module_name}: {e}")
        
        logger.info("Route setup completed")
        
    except Exception as e:
        logger.error(f"💥 Critical error in route setup: {e}")

def setup_database():
    """Setup database with error handling"""
    try:
        logger.info("Setting up database...")
        
        from database import engine
        import models
        
        # Create tables
        models.Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
    except ImportError as e:
        logger.error(f"❌ Database import error: {e}")
    except Exception as e:
        logger.error(f"💥 Database setup error: {e}")

def setup_prediction_service():
    """Setup prediction service with error handling"""
    try:
        logger.info("Setting up prediction service...")
        
        from startup import initialize_prediction_service
        initialize_prediction_service()
        logger.info("✅ Prediction service initialized")
        
    except ImportError as e:
        logger.error(f"❌ Prediction service import error: {e}")
    except Exception as e:
        logger.error(f"💥 Prediction service error: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("🚀 Starting Finlytics API...")
    
    # Setup database
    setup_database()
    
    # Setup routes
    setup_routes()
    
    # Setup prediction service
    setup_prediction_service()
    
    logger.info("🎉 Finlytics API startup completed!")

# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("🛑 Shutting down Finlytics API...")
    
    try:
        from startup import cleanup_prediction_service
        cleanup_prediction_service()
        logger.info("✅ Prediction service cleaned up")
    except Exception as e:
        logger.error(f"💥 Error during shutdown: {e}")
    
    logger.info("👋 Finlytics API shutdown completed")

# For debugging - show what environment variables are available
@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to show environment variables (be careful in production!)"""
    env_vars = {}
    for key, value in os.environ.items():
        # Don't expose sensitive values
        if any(sensitive in key.upper() for sensitive in ['SECRET', 'KEY', 'PASSWORD', 'TOKEN']):
            env_vars[key] = "***HIDDEN***"
        else:
            env_vars[key] = value
    
    return {"environment_variables": env_vars}

@app.get("/debug/config-check")
async def config_check():
    """Check which required environment variables are missing"""
    required_vars = {
        "JWT_SECRET_KEY": "Required for user authentication",
        "DATABASE_URL": "Required for database connection", 
        "PLAID_CLIENT_ID": "Required for bank integration",
        "PLAID_SECRET": "Required for bank integration",
        "ENCRYPTION_KEY": "Required for data encryption"
    }
    
    optional_vars = {
        "FMP_API_KEY": "Stock data API",
        "SENDGRID_API_KEY": "Email service", 
        "HUGGING_FACE_URL": "AI predictions",
        "HUGGING_FACE_TOKEN": "AI service authentication"
    }
    
    missing_required = []
    missing_optional = []
    present_vars = []
    
    for var, description in required_vars.items():
        if os.getenv(var):
            present_vars.append(f"✅ {var}: {description}")
        else:
            missing_required.append(f"❌ {var}: {description}")
    
    for var, description in optional_vars.items():
        if os.getenv(var):
            present_vars.append(f"✅ {var}: {description}")
        else:
            missing_optional.append(f"⚠️  {var}: {description}")
    
    return {
        "status": "missing_required" if missing_required else "ready",
        "present_variables": present_vars,
        "missing_required": missing_required,
        "missing_optional": missing_optional,
        "login_will_work": len(missing_required) == 0,
        "note": "Set missing required variables in Railway environment settings"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main_simple:app", host="0.0.0.0", port=port, log_level="info")