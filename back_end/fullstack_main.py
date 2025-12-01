#!/usr/bin/env python3
"""
Full-stack FastAPI app serving both frontend and backend
"""
import os
import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Finlytics Full-Stack API")

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import backend modules with error handling
try:
    from database import SessionLocal
    from auth import get_current_user
    import auth
    import models
    from database import engine
    
    # Create database tables
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Database and auth modules loaded successfully")
    
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    db_dependency = Annotated[Session, Depends(get_db)]
    user_dependency = Annotated[dict, Depends(get_current_user)]
    
    # Include auth router
    app.include_router(auth.router)
    
    # Add other routers with error handling
    backend_routes = [
        ("user_info", "User info routes"),
        ("user_settings", "User settings routes"), 
        ("user_categories", "User categories routes"),
        ("pie_chart", "Chart routes"),
        ("entered_transactions", "Transaction routes"),
        ("balance_routes", "Balance routes")
    ]
    
    for module_name, description in backend_routes:
        try:
            module = __import__(module_name)
            if hasattr(module, 'router'):
                app.include_router(module.router)
                logger.info(f"✅ Loaded {description}")
        except Exception as e:
            logger.warning(f"⚠️  Skipped {module_name}: {e}")
    
    AUTH_AVAILABLE = True
    
except Exception as e:
    logger.error(f"❌ Backend modules failed to load: {e}")
    AUTH_AVAILABLE = False

# API Routes
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "finlytics-fullstack",
        "auth_available": AUTH_AVAILABLE,
        "frontend_available": FRONTEND_AVAILABLE,
        "jwt_configured": bool(os.getenv("JWT_SECRET_KEY")),
        "database_configured": bool(os.getenv("DATABASE_URL")),
        "current_dir": os.getcwd(),
        "dist_exists": os.path.exists("/app/dist"),
        "local_dist_exists": os.path.exists("../dist"),
        "files_in_root": os.listdir("/app") if os.path.exists("/app") else "not found"
    }

@app.get("/api/test")
async def test_endpoint():
    return {
        "message": "✅ Full-stack API working!",
        "auth_available": AUTH_AVAILABLE,
        "backend_ready": AUTH_AVAILABLE and bool(os.getenv("JWT_SECRET_KEY"))
    }

# Serve static frontend files
try:
    # Debug: Check available paths
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Files in current directory: {os.listdir('.')}")
    
    possible_paths = ["/app/dist", "../dist", "dist"]
    dist_path = None
    
    for path in possible_paths:
        if os.path.exists(path):
            dist_path = path
            logger.info(f"Found dist directory at: {path}")
            if os.path.exists(os.path.join(path, "index.html")):
                logger.info(f"✅ index.html found in {path}")
            else:
                logger.warning(f"⚠️ index.html NOT found in {path}")
            break
    
    if dist_path:
        # Mount assets directory to serve JS, CSS, images
        assets_path = os.path.join(dist_path, "assets")
        if os.path.exists(assets_path):
            app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
            logger.info(f"✅ Assets mounted from {assets_path}")
        
        # Also mount vite.svg and other root files  
        app.mount("/static", StaticFiles(directory=dist_path), name="static")
        logger.info(f"✅ Frontend static files mounted from {dist_path}")
        FRONTEND_AVAILABLE = True
    else:
        logger.error("❌ No dist directory found")
        FRONTEND_AVAILABLE = False
        
except Exception as e:
    logger.warning(f"⚠️  Frontend files not available: {e}")
    FRONTEND_AVAILABLE = False

# Serve vite.svg and other root-level static files
@app.get("/vite.svg")
async def serve_vite_svg():
    dist_path = "/app/dist" if os.path.exists("/app/dist") else "../dist"
    vite_svg_path = os.path.join(dist_path, "vite.svg")
    if os.path.exists(vite_svg_path):
        return FileResponse(vite_svg_path)
    raise HTTPException(status_code=404, detail="vite.svg not found")

# Serve the React app for all non-API routes
@app.get("/")
async def serve_frontend():
    if FRONTEND_AVAILABLE:
        try:
            index_path = "/app/dist/index.html" if os.path.exists("/app/dist/index.html") else "../dist/index.html"
            return FileResponse(index_path)
        except Exception as e:
            logger.error(f"Failed to serve index.html: {e}")
            pass
    
    # Fallback response if frontend not available
    return {
        "message": "🎉 Finlytics Full-Stack API",
        "frontend_available": FRONTEND_AVAILABLE,
        "backend_available": AUTH_AVAILABLE,
        "api_endpoints": [
            "/api/health",
            "/api/test", 
            "/api/auth/register",
            "/api/auth/login" if AUTH_AVAILABLE else "❌ Auth not configured"
        ]
    }

# Catch-all route for React Router
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Don't serve frontend for API routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    if FRONTEND_AVAILABLE:
        try:
            index_path = "/app/dist/index.html" if os.path.exists("/app/dist/index.html") else "../dist/index.html"
            return FileResponse(index_path)
        except Exception as e:
            logger.error(f"Failed to serve React app: {e}")
            pass
    
    return {"error": "Frontend not available", "path": full_path}