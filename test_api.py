#!/usr/bin/env python3
"""
Simple API testing script to debug issues
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints_with_token(token):
    """Test various endpoints with the provided token"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=== Testing User Balances ===")
    try:
        response = requests.get(f"{BASE_URL}/user_balances/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Plaid balances count: {len(data.get('plaid_balances', []))}")
            print(f"Account types: {[acc.get('subtype') for acc in data.get('plaid_balances', [])]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n=== Testing Pie Chart ===")
    try:
        response = requests.get(f"{BASE_URL}/pie_chart/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Categories found: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            print(f"Category data: {data}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # You can replace this with a real token for testing
    print("To test, run: python test_api.py")
    print("Then manually call test_endpoints_with_token('your_jwt_token_here')")