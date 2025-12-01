# 🔐 Railway Environment Variables Setup Guide

This guide shows you how to add environment variables to your Railway backend deployment.

## 📋 Required Environment Variables

### 🗃️ Database Configuration
```bash
# Option 1: Individual database variables (recommended for flexibility)
DATABASE_USERNAME=your_mysql_username
DATABASE_PASSWORD=your_mysql_password  
DATABASE_HOST=your_mysql_host.amazonaws.com
DATABASE_NAME=your_database_name

# Option 2: Single database URL (Railway can auto-generate this)
DATABASE_URL=mysql+pymysql://username:password@host/database_name
```

### 🔑 Authentication & Security
```bash
JWT_SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 💳 Plaid Integration (for banking features)
```bash
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENVIRONMENT=sandbox  # or development/production
```

### 📈 Stock Market API
```bash
FMP_API_KEY=your_financial_modeling_prep_api_key
```

### 📧 Email Service (SendGrid)
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 🤖 AI Model Integration
```bash
HUGGINGFACE_API_URL=https://your-username-finlytics-ai.hf.space
```

---

## 🚀 How to Add Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Navigate to your backend project

2. **Open Variables Tab**
   - Click on your service/deployment
   - Go to **Variables** tab

3. **Add Each Variable**
   - Click **+ New Variable**
   - Enter **Variable Name** and **Value**
   - Click **Add**

4. **Deploy Changes**
   - Variables are automatically applied on next deployment
   - Click **Deploy** if needed to trigger update

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Add variables one by one
railway variables set DATABASE_USERNAME=your_username
railway variables set DATABASE_PASSWORD=your_password
railway variables set JWT_SECRET_KEY=your_secret_key

# Deploy with new variables
railway up
```

### Method 3: Environment File (Local Development Only)

Create `.env` file in `back_end/` folder:
```bash
# .env (DO NOT commit to git - already in .gitignore)
DATABASE_USERNAME=website_user
DATABASE_PASSWORD=iamthesiteuser
DATABASE_HOST=financesite.cdoka0swm67i.us-east-2.rds.amazonaws.com
DATABASE_NAME=database
JWT_SECRET_KEY=your_super_secret_key
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
FMP_API_KEY=your_fmp_api_key
SENDGRID_API_KEY=your_sendgrid_key
```

---

## 🗂️ Variable Priority & Best Practices

### 🎯 Variable Priority (High to Low)
1. **Railway Environment Variables** (Production)
2. **Local .env file** (Development)  
3. **Default values** (Fallback in code)

### 🛡️ Security Best Practices
- ✅ **Use Railway Variables** for production secrets
- ✅ **Never commit** `.env` files to git
- ✅ **Generate strong keys** for JWT_SECRET_KEY and ENCRYPTION_KEY
- ✅ **Use environment-specific** Plaid keys (sandbox vs production)

### 🔑 Generating Secure Keys

**JWT Secret Key (32+ characters):**
```python
import secrets
secrets.token_urlsafe(32)
```

**Encryption Key (32 characters exactly):**
```python
import secrets
secrets.token_bytes(32).hex()[:32]
```

---

## 🧪 Testing Your Setup

### 1. Test Database Connection
After adding variables, check Railway logs:
```
Railway Dashboard → Your Service → Deployments → View Logs
```

Look for:
- ✅ `"Database connection successful"`
- ❌ `"Database connection failed"`

### 2. Test API Endpoints
Visit your Railway backend URL:
```
https://your-backend-name.railway.app/health
```

Should return:
```json
{"status": "healthy", "service": "finlytics-backend"}
```

### 3. Test Environment Variables
Add a debug endpoint (temporary):
```python
@app.get("/debug/env")
async def debug_env():
    return {
        "database_host": os.getenv("DATABASE_HOST", "not_set"),
        "jwt_key_exists": bool(os.getenv("JWT_SECRET_KEY")),
        "plaid_env": os.getenv("PLAID_ENVIRONMENT", "not_set")
    }
```

---

## 🚨 Troubleshooting

### Database Connection Issues
- **Check**: All 4 database variables are set
- **Verify**: Database host is accessible from Railway
- **Test**: Connection string format is correct

### Authentication Issues  
- **Check**: JWT_SECRET_KEY is set and long enough
- **Verify**: ENCRYPTION_KEY is exactly 32 characters

### API Integration Issues
- **Check**: All API keys are valid and not expired
- **Verify**: Plaid environment matches your key type
- **Test**: API endpoints from Railway logs

---

## 📞 Need Help?

1. **Railway Logs**: Check deployment logs for specific errors
2. **Database Connectivity**: Ensure AWS RDS allows Railway IP ranges  
3. **API Keys**: Verify all third-party service keys are active
4. **Environment**: Double-check variable names match code exactly