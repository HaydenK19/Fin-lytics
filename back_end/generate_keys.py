#!/usr/bin/env python3
"""
Generate secure keys for Railway environment variables
Run this script to generate the required secret keys
"""

import secrets
import string
import base64

def generate_jwt_secret(length=64):
    """Generate a secure JWT secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_encryption_key():
    """Generate a 32-byte encryption key for Fernet"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()

def main():
    print("🔐 Finlytics Backend - Secure Key Generator")
    print("=" * 50)
    
    jwt_secret = generate_jwt_secret()
    encryption_key = generate_encryption_key()
    
    print("\n📋 Copy these to your Railway environment variables:")
    print("-" * 50)
    print(f"JWT_SECRET_KEY={jwt_secret}")
    print(f"ENCRYPTION_KEY={encryption_key}")
    
    print("\n🔧 Additional required variables:")
    print("-" * 30)
    print("ALGORITHM=HS256")
    print("ACCESS_TOKEN_EXPIRE_MINUTES=60")
    print("RAILWAY_ENVIRONMENT=production")
    
    print("\n💾 Database URL format:")
    print("-" * 20)
    print("DATABASE_URL=mysql+pymysql://username:password@host:port/database")
    
    print("\n🏦 Plaid Integration (if using bank features):")
    print("-" * 40)
    print("PLAID_CLIENT_ID=your_plaid_client_id")
    print("PLAID_SECRET=your_plaid_secret")
    print("PLAID_ENVIRONMENT=sandbox")
    
    print("\n📈 Optional APIs:")
    print("-" * 15)
    print("FMP_API_KEY=your_financial_modeling_prep_key")
    print("SENDGRID_API_KEY=your_sendgrid_key")
    print("HUGGING_FACE_URL=https://your-model.hf.space")
    
    print("\n✅ Next steps:")
    print("1. Copy the JWT_SECRET_KEY and ENCRYPTION_KEY above")
    print("2. Go to Railway → Your Backend Service → Variables")
    print("3. Add each variable as a new environment variable")
    print("4. Set up your database and add DATABASE_URL")
    print("5. Redeploy the service")

if __name__ == "__main__":
    main()