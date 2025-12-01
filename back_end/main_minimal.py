#!/usr/bin/env python3
"""
Minimal FastAPI app for Railway deployment debugging
"""
import os
from fastapi import FastAPI

# Create minimal app
app = FastAPI(title="Finlytics Debug API")

@app.get("/")
async def root():
    return {
        "message": "🎉 Finlytics API is working!",
        "status": "healthy",
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
        "database_configured": bool(os.getenv("DATABASE_URL"))
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main_minimal:app", host="0.0.0.0", port=port)