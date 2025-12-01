# 🚀 RAILWAY BACKEND ENVIRONMENT VARIABLES
# Copy these variables to your Railway backend service environment settings

# ==== CRITICAL FOR LOGIN/AUTH ====
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ==== DATABASE (REQUIRED) ====
# Option 1: Full DATABASE_URL (recommended) - REPLACE WITH REAL VALUES:
DATABASE_URL=mysql+pymysql://your_username:your_password@your_host:3306/your_database

# Example formats:
# MySQL: mysql+pymysql://user:pass@host.com:3306/dbname
# PostgreSQL: postgresql://user:pass@host.com:5432/dbname
# SQLite (dev only): sqlite:///./finlytics.db

# Option 2: Individual database components (if you prefer)
# DATABASE_USERNAME=your_db_username
# DATABASE_PASSWORD=your_db_password  
# DATABASE_HOST=your_db_host:3306
# DATABASE_NAME=your_db_name

# ==== PLAID BANK INTEGRATION ====
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENVIRONMENT=sandbox
ENCRYPTION_KEY=your-32-character-encryption-key

# ==== STOCK DATA APIS ====
FMP_API_KEY=your_financial_modeling_prep_key

# ==== EMAIL SERVICE ====
SENDGRID_API_KEY=your_sendgrid_api_key

# ==== AI PREDICTIONS ====
HUGGING_FACE_URL=https://your-model.hf.space
HUGGING_FACE_TOKEN=your_hf_token

# ==== RAILWAY SPECIFIC ====
RAILWAY_ENVIRONMENT=production