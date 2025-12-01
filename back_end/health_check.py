#!/usr/bin/env python3
"""
Simple health check script to test Railway deployment
Run this to see what's failing during startup
"""

import sys
import traceback

def test_imports():
    """Test all imports to identify the failing module"""
    modules_to_test = [
        'fastapi',
        'uvicorn',
        'sqlalchemy', 
        'pymysql',
        'pandas',
        'numpy',
        'requests',
        'httpx',
        'python_dotenv',
        'plaid',
        'sendgrid',
        'passlib',
        'bcrypt',
        'jose'
    ]
    
    failed_imports = []
    
    for module in modules_to_test:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except ImportError as e:
            print(f"❌ {module} - FAILED: {e}")
            failed_imports.append(module)
        except Exception as e:
            print(f"⚠️  {module} - ERROR: {e}")
            failed_imports.append(module)
    
    return failed_imports

def test_local_imports():
    """Test local module imports"""
    local_modules = [
        'models',
        'database', 
        'auth',
        'plaid_routes',
        'user_info',
        'user_settings',
        'startup'
    ]
    
    failed_local = []
    
    for module in local_modules:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except ImportError as e:
            print(f"❌ {module} - FAILED: {e}")
            failed_local.append(module)
        except Exception as e:
            print(f"⚠️  {module} - ERROR: {e}")
            failed_local.append(module)
    
    return failed_local

def test_database_connection():
    """Test database connection"""
    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("❌ DATABASE_URL environment variable not set")
            return False
            
        from sqlalchemy import create_engine
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        
        print("✅ Database connection - OK")
        return True
        
    except Exception as e:
        print(f"❌ Database connection - FAILED: {e}")
        return False

def main():
    print("🔍 Railway Deployment Health Check")
    print("=" * 40)
    
    print("\n1. Testing External Dependencies:")
    failed_external = test_imports()
    
    print("\n2. Testing Local Modules:")
    failed_local = test_local_imports()
    
    print("\n3. Testing Database Connection:")
    db_ok = test_database_connection()
    
    print("\n" + "=" * 40)
    print("📋 SUMMARY:")
    
    if failed_external:
        print(f"❌ Failed external imports: {failed_external}")
    
    if failed_local:
        print(f"❌ Failed local imports: {failed_local}")
    
    if not db_ok:
        print("❌ Database connection failed")
    
    if not failed_external and not failed_local and db_ok:
        print("✅ All tests passed! App should start successfully.")
        return 0
    else:
        print("❌ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"💥 CRITICAL ERROR: {e}")
        traceback.print_exc()
        sys.exit(1)