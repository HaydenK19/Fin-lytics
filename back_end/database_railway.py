"""
Railway-compatible database configuration
Supports both PostgreSQL (Railway native) and SQLite (fallback)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def get_database_url():
    """
    Get database URL from environment with fallbacks
    Priority: 1. DATABASE_URL (Railway PostgreSQL), 2. SQLite fallback
    """
    
    # Primary: Use Railway's DATABASE_URL environment variable
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        # Railway PostgreSQL or other external database
        print(f"✅ Using Railway database: {database_url[:20]}...")
        return database_url
    
    # Fallback 1: Try AWS RDS (your original config)
    if all([
        os.getenv("DATABASE_USERNAME"),
        os.getenv("DATABASE_PASSWORD"),
        os.getenv("DATABASE_HOST"),
        os.getenv("DATABASE_NAME")
    ]):
        aws_url = f"mysql+pymysql://{os.getenv('DATABASE_USERNAME')}:{os.getenv('DATABASE_PASSWORD')}@{os.getenv('DATABASE_HOST')}/{os.getenv('DATABASE_NAME')}"
        print(f"⚠️ Using AWS RDS database: {aws_url[:30]}...")
        return aws_url
    
    # Fallback 2: SQLite for development/testing
    sqlite_path = os.getenv("SQLITE_PATH", "./data/finlytics.db")
    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"⚠️ Using SQLite fallback: {sqlite_url}")
    
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(sqlite_path) if "/" in sqlite_path else ".", exist_ok=True)
    
    return sqlite_url

# Get the appropriate database URL
DATABASE_URL = get_database_url()

# Create engine with appropriate settings
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL settings (Railway)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
elif DATABASE_URL.startswith("mysql"):
    # MySQL settings (AWS RDS)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
else:
    # SQLite settings (development)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def test_connection():
    """Test database connectivity"""
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT 1").fetchone()
            print(f"✅ Database connection successful: {result}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print(f"Database URL: {DATABASE_URL}")
    test_connection()