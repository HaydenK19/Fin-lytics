# 🚀 RAILWAY BACKEND ENVIRONMENT VARIABLES  
# Backend Service: bountiful-gratitude
# Backend URL: https://bountiful-gratitude.railway.app
# Copy these variables to your Railway backend service environment settings

# ==== CRITICAL FOR LOGIN/AUTH ====
JWT_SECRET_KEY=8ox#y8*aaquBHbiXC2Af9p4l^M9N2mLNuN4b1uxVxb9^kMqDBrCQhs$a@S@GP@GL
ENCRYPTION_KEY=G547zKZELPQYA-t3iKPaeNs6vnhoT9vFa-BSJJN3G9o=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ==== DATABASE (AWS RDS MySQL) ====
# Your existing AWS RDS database connection:
DATABASE_URL=mysql+pymysql://website_user:iamthesiteuser@financesite.cdoka0swm67i.us-east-2.rds.amazonaws.com:3306/database

# Alternative: Individual components (already configured as fallbacks)
# DATABASE_USERNAME=website_user
# DATABASE_PASSWORD=iamthesiteuser  
# DATABASE_HOST=financesite.cdoka0swm67i.us-east-2.rds.amazonaws.com
# DATABASE_NAME=database

# ==== PLAID BANK INTEGRATION (Optional - to remove errors) ====
PLAID_CLIENT_ID=sandbox_placeholder
PLAID_SECRET=sandbox_placeholder
PLAID_ENVIRONMENT=sandbox

# ==== STOCK DATA APIS ====
FMP_API_KEY=your_financial_modeling_prep_key

# ==== EMAIL SERVICE ====
SENDGRID_API_KEY=your_sendgrid_api_key

# ==== AI PREDICTIONS ====
HUGGING_FACE_URL=https://your-model.hf.space
HUGGING_FACE_TOKEN=your_hf_token

# ==== RAILWAY SPECIFIC ====
RAILWAY_ENVIRONMENT=production