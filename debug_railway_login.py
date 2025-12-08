"""
Railway Login Debug Helper
Run this to check what's causing login issues
"""
import os
import requests
import json
from datetime import datetime

def test_railway_login():
    """Test login on your Railway deployment"""
    
    # Replace with your Railway app URL
    RAILWAY_URL = input("Enter your Railway app URL (e.g., https://your-app.railway.app): ").strip()
    
    if not RAILWAY_URL:
        print("❌ No URL provided")
        return
    
    print(f"🔍 Testing Railway deployment at: {RAILWAY_URL}")
    print("=" * 50)
    
    # Test 1: Check if backend is accessible
    print("1. Testing backend accessibility...")
    try:
        # Try different API endpoints
        endpoints_to_try = ["/api/health", "/health", "/api/docs"]
        
        for endpoint in endpoints_to_try:
            health_response = requests.get(f"{RAILWAY_URL}{endpoint}", timeout=10)
            print(f"   {endpoint}: {health_response.status_code}")
            
            if health_response.status_code == 200:
                try:
                    # Try to parse as JSON
                    json_response = health_response.json()
                    print(f"   JSON Response: {json_response}")
                    break
                except:
                    # Not JSON, probably HTML frontend
                    content = health_response.text[:200]
                    if "<!DOCTYPE" in content or "<html" in content:
                        print(f"   Response: HTML content (frontend) - {len(health_response.text)} chars")
                    else:
                        print(f"   Response: {content}")
            else:
                print(f"   Error: {health_response.text[:200]}")
                
    except Exception as e:
        print(f"   ❌ Backend test failed: {e}")
        return
    
    # Test 2: Check database connectivity
    print("\n2. Testing database connectivity...")
    try:
        db_response = requests.get(f"{RAILWAY_URL}/test-db", timeout=10)
        print(f"   Database test: {db_response.status_code}")
        if db_response.status_code == 200:
            print(f"   Database: Connected ✅")
        else:
            print(f"   Database: Connection failed ❌")
            print(f"   Error: {db_response.text}")
    except Exception as e:
        print(f"   ❌ Database test failed: {e}")
    
    # Test 3: Try login with test credentials
    print("\n3. Testing login functionality...")
    
    # Get credentials from user
    username = input("Enter username to test: ").strip()
    password = input("Enter password to test: ").strip()
    
    if not username or not password:
        print("❌ No credentials provided")
        return
    
    # Test login
    try:
        login_data = {
            "username": username,
            "password": password
        }
        
        # Try different login endpoints
        login_endpoints = ["/api/auth/token", "/auth/token", "/api/auth/login"]
        
        for endpoint in login_endpoints:
            print(f"   Trying login endpoint: {endpoint}")
            try:
                login_response = requests.post(
                    f"{RAILWAY_URL}{endpoint}",
                    data=login_data,  # OAuth2PasswordRequestForm expects form data
                    timeout=10
                )
                print(f"   Status: {login_response.status_code}")
                
                if login_response.status_code != 405:  # Not "Method Not Allowed"
                    break
                    
            except Exception as e:
                print(f"   Error with {endpoint}: {e}")
                continue
        
        print(f"   Login attempt: {login_response.status_code}")
        
        if login_response.status_code == 200:
            print("   ✅ Login successful!")
            response_data = login_response.json()
            print(f"   Token received: {response_data.get('access_token', 'No token')[:50]}...")
        else:
            print("   ❌ Login failed!")
            print(f"   Status: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            
            # Common error analysis
            if login_response.status_code == 401:
                print("\n   🔍 Analysis: Invalid credentials or password hashing issue")
            elif login_response.status_code == 403:
                print("\n   🔍 Analysis: Account not verified or disabled")
            elif login_response.status_code == 500:
                print("\n   🔍 Analysis: Server error - likely database issue")
                
    except Exception as e:
        print(f"   ❌ Login test failed: {e}")
    
    # Test 4: Check user exists in database
    print("\n4. Testing if user exists...")
    try:
        # This endpoint would need to be added to your backend
        user_check = requests.get(f"{RAILWAY_URL}/debug/user/{username}", timeout=10)
        if user_check.status_code == 200:
            user_data = user_check.json()
            print(f"   User exists: ✅")
            print(f"   Verified: {user_data.get('is_verified', 'Unknown')}")
            print(f"   Created: {user_data.get('created_at', 'Unknown')}")
        else:
            print(f"   User check: {user_check.status_code}")
    except Exception as e:
        print(f"   User check failed: {e}")
    
    # Test 5: Environment variables check
    print("\n5. Testing environment variables...")
    try:
        env_response = requests.get(f"{RAILWAY_URL}/debug/env", timeout=10)
        if env_response.status_code == 200:
            env_data = env_response.json()
            print(f"   DATABASE_URL set: {'✅' if env_data.get('database_url') else '❌'}")
            print(f"   SECRET_KEY set: {'✅' if env_data.get('secret_key') else '❌'}")
        else:
            print(f"   Env check failed: {env_response.status_code}")
    except Exception as e:
        print(f"   Env check failed: {e}")
    
    print("\n" + "=" * 50)
    print("🔧 TROUBLESHOOTING STEPS:")
    print("1. Check Railway environment variables")
    print("2. Verify database connection")
    print("3. Check if user account exists and is verified")
    print("4. Ensure password hashing is consistent")
    print("5. Check Railway deployment logs")

if __name__ == "__main__":
    test_railway_login()