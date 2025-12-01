#!/usr/bin/env python3
"""
Minimal FastAPI app for Railway deployment debugging
"""
import os
import logging
from fastapi import FastAPI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create minimal app with debug info
app = FastAPI(title="Finlytics Debug API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Finlytics minimal API starting up...")
    logger.info(f"PORT: {os.getenv('PORT', 'NOT_SET')}")
    logger.info(f"JWT_SECRET_KEY: {'SET' if os.getenv('JWT_SECRET_KEY') else 'NOT_SET'}")
    logger.info(f"DATABASE_URL: {'SET' if os.getenv('DATABASE_URL') else 'NOT_SET'}")

@app.get("/")
async def root():
    return {
        "message": "🎉 Finlytics API is working!",
        "status": "healthy", 
        "service": "finlytics-minimal",
        "port": os.getenv("PORT", "unknown"),
        "environment_check": {
            "JWT_SECRET_KEY": "SET" if os.getenv("JWT_SECRET_KEY") else "NOT_SET",
            "DATABASE_URL": "SET" if os.getenv("DATABASE_URL") else "NOT_SET"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "finlytics-minimal"}

@app.get("/test")
async def test():
    return {
        "message": "✅ Test endpoint working",
        "jwt_configured": bool(os.getenv("JWT_SECRET_KEY")),
        "database_configured": bool(os.getenv("DATABASE_URL")),
        "port": os.getenv("PORT", "unknown")
    }