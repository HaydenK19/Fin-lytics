#!/usr/bin/env python3
"""
Generate secure keys for Finlytics backend environment variables
Run: python generate_keys.py
"""

import secrets
import string

def generate_jwt_secret(length=64):
    """Generate a secure JWT secret key"""
    return secrets.token_urlsafe(length)

def generate_encryption_key():
    """Generate a 32-character encryption key for Plaid"""
    return secrets.token_bytes(16).hex()  # 16 bytes = 32 hex characters

def generate_random_password(length=20):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def main():
    print("🔐 Finlytics Security Keys Generator")
    print("=" * 50)
    
    print("\n🔑 JWT Secret Key (copy to JWT_SECRET_KEY):")
    print(f"JWT_SECRET_KEY={generate_jwt_secret()}")
    
    print("\n🔐 Encryption Key (copy to ENCRYPTION_KEY):")
    print(f"ENCRYPTION_KEY={generate_encryption_key()}")
    
    print("\n🔒 Random Password (for database if needed):")
    print(f"RANDOM_PASSWORD={generate_random_password()}")
    
    print("\n📋 Copy these to your Railway environment variables!")
    print("Visit: https://railway.app → Your Project → Variables")

if __name__ == "__main__":
    main()