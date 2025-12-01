#!/usr/bin/env python3
"""
Environment configuration with fallbacks for Railway deployment
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_env_with_default(key: str, default: str = "", required: bool = False) -> str:
    """Get environment variable with default value and required check"""
    value = os.getenv(key, default)
    
    if required and not value:
        raise ValueError(f"Required environment variable {key} is not set")
    
    return value

# Database configuration
DATABASE_URL = get_env_with_default("DATABASE_URL", "sqlite:///./finlytics.db")

# JWT configuration  
SECRET_KEY = get_env_with_default("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = get_env_with_default("ALGORITHM", "HS256")

# API Keys (not required for basic operation)
FMP_API_KEY = get_env_with_default("FMP_API_KEY")
PLAID_CLIENT_ID = get_env_with_default("PLAID_CLIENT_ID") 
PLAID_SECRET = get_env_with_default("PLAID_SECRET")
PLAID_ENV = get_env_with_default("PLAID_ENV", "sandbox")
SENDGRID_API_KEY = get_env_with_default("SENDGRID_API_KEY")
FROM_EMAIL = get_env_with_default("FROM_EMAIL", "noreply@fin-lytics.com")
POLYGON_API_KEY = get_env_with_default("POLYGON_API_KEY")

# Hugging Face AI service
HUGGING_FACE_URL = get_env_with_default("HUGGING_FACE_URL", "https://finlytics-ai.hf.space")
HUGGING_FACE_TOKEN = get_env_with_default("HUGGING_FACE_TOKEN")

# Railway specific
RAILWAY_ENVIRONMENT = get_env_with_default("RAILWAY_ENVIRONMENT", "development")
PORT = int(get_env_with_default("PORT", "8000"))

def validate_config():
    """Validate critical configuration"""
    issues = []
    
    if "sqlite" in DATABASE_URL and RAILWAY_ENVIRONMENT == "production":
        issues.append("⚠️  Using SQLite in production - should use MySQL/PostgreSQL")
    
    if SECRET_KEY == "dev-secret-key-change-in-production":
        issues.append("⚠️  Using default secret key - should set SECRET_KEY environment variable")
    
    if not FMP_API_KEY:
        issues.append("ℹ️  FMP_API_KEY not set - stock data features will be limited")
    
    if not PLAID_CLIENT_ID or not PLAID_SECRET:
        issues.append("ℹ️  Plaid credentials not set - bank integration will be disabled")
    
    return issues

if __name__ == "__main__":
    print("🔧 Configuration Status:")
    print(f"DATABASE_URL: {DATABASE_URL}")
    print(f"SECRET_KEY: {'***SET***' if SECRET_KEY != 'dev-secret-key-change-in-production' else '***DEFAULT***'}")
    print(f"RAILWAY_ENVIRONMENT: {RAILWAY_ENVIRONMENT}")
    print(f"PORT: {PORT}")
    print(f"HUGGING_FACE_URL: {HUGGING_FACE_URL}")
    
    issues = validate_config()
    if issues:
        print("\n📋 Configuration Issues:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ Configuration looks good!")