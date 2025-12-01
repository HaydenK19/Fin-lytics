from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

# Database Configuration - Use environment variables with fallbacks for local development
DATABASE_USERNAME = os.getenv("DATABASE_USERNAME", "website_user")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "iamthesiteuser")
DATABASE_HOST = os.getenv("DATABASE_HOST", "financesite.cdoka0swm67i.us-east-2.rds.amazonaws.com")
DATABASE_NAME = os.getenv("DATABASE_NAME", "database")

# Support for Railway's DATABASE_URL or construct from individual components
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Construct from individual components if no DATABASE_URL provided
    DATABASE_URL = f"mysql+pymysql://{DATABASE_USERNAME}:{DATABASE_PASSWORD}@{DATABASE_HOST}/{DATABASE_NAME}"
    logger.info("Constructed DATABASE_URL from individual components")
else:
    logger.info("Using provided DATABASE_URL")

# Validate DATABASE_URL format
if "://" not in DATABASE_URL:
    logger.error(f"Invalid DATABASE_URL format: {DATABASE_URL}")
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./finlytics.db"
    logger.warning("Falling back to SQLite database for development")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    # Fallback to SQLite
    DATABASE_URL = "sqlite:///./finlytics.db"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    logger.warning("Falling back to SQLite database")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
