# Railway Login Issue Troubleshooting Guide

## 🚨 MOST COMMON CAUSES OF LOGIN FAILURES ON RAILWAY:

### 1. **Database Connection Issues** (90% of cases)
Your local code uses **AWS RDS MySQL**, but Railway can't connect to it.

**Problem:** Railway tries to connect to your AWS database but fails
**Solution:** Use Railway's built-in PostgreSQL database

#### Fix Option A: Use Railway PostgreSQL (Recommended)
1. **In Railway Dashboard:**
   - Go to your project
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will create a free PostgreSQL database
   - Copy the `DATABASE_URL` from the database service

2. **Add to Environment Variables:**
   ```
   DATABASE_URL=postgresql://postgres:password@hostname:5432/railway
   ```

#### Fix Option B: Use SQLite for testing
1. **In Railway Dashboard, set:**
   ```
   DATABASE_URL=sqlite:///./data/finlytics.db
   ```

### 2. **Missing Environment Variables**
Railway doesn't have the same environment variables as your local setup.

**Required Environment Variables in Railway:**
```bash
# Authentication
SECRET_KEY=your-super-secret-jwt-key-railway-production
DATABASE_URL=postgresql://or-sqlite://path

# Plaid (if using banking features)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Email (if using email verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. **Password Hashing Inconsistency**
Local vs Railway might use different bcrypt versions.

**Check:** Do you have users created locally but trying to login on Railway?
**Solution:** Create a new account on Railway or migrate users properly.

### 4. **User Account Not Verified**
Your account might require email verification.

**Check:** Is your user account verified?
**Solution:** Check the `is_verified` field in your database.

## 🔧 STEP-BY-STEP DEBUG PROCESS:

### Step 1: Check Railway Deployment Status
1. Go to Railway dashboard
2. Check if deployment succeeded
3. Look at deployment logs for errors

### Step 2: Test Basic Connectivity
```bash
# Test if your Railway app responds
curl https://your-app.railway.app/api/health

# Should return status 200 with JSON response
```

### Step 3: Check Database Connection
```bash
# Test database connectivity
curl https://your-app.railway.app/api/debug/database

# Should return: {"status": "success", "message": "Database connected"}
```

### Step 4: Check Environment Variables
```bash
# Check if environment variables are set
curl https://your-app.railway.app/api/debug/env

# Should return true for required variables
```

### Step 5: Check if User Exists
```bash
# Replace 'yourusername' with your actual username
curl https://your-app.railway.app/api/debug/user/yourusername

# Should return user info if account exists
```

### Step 6: Test Login
```bash
# Test login with curl
curl -X POST https://your-app.railway.app/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=yourusername&password=yourpassword"

# Should return access token if successful
```

## 🚀 QUICK FIXES:

### Quick Fix 1: Switch to SQLite (Fastest)
1. **In Railway Environment Variables, set:**
   ```
   DATABASE_URL=sqlite:///./data/finlytics.db
   ```
2. **Redeploy**
3. **Create new account** on Railway (don't use local account)

### Quick Fix 2: Use Railway PostgreSQL
1. **Add PostgreSQL database** in Railway dashboard
2. **Copy DATABASE_URL** from database service
3. **Set in environment variables**
4. **Redeploy**
5. **Create new account** on Railway

### Quick Fix 3: Create Test Account
If you want to test immediately:
1. Go to your Railway app registration page
2. Create a new account directly on Railway
3. Use those credentials to login

## 🔍 COMMON ERROR MESSAGES:

- **"Incorrect username or password"** → Database connection or hashing issue
- **"Email not verified"** → Account needs verification
- **"Internal Server Error"** → Database connection failed
- **"Connection refused"** → Railway can't reach your AWS database
- **"Invalid token"** → SECRET_KEY mismatch

## 📞 TESTING YOUR FIX:

After implementing fixes:

1. **Test health endpoint:**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

2. **Test database:**
   ```bash
   curl https://your-app.railway.app/api/debug/database
   ```

3. **Create new account:**
   - Use Railway's frontend to register
   - Don't use your local account initially

4. **Test login:**
   - Use the newly created Railway account
   - Should work if database is properly configured

## 🎯 MOST LIKELY SOLUTION:
**99% chance the issue is:** Railway can't connect to your AWS RDS database. Switch to Railway PostgreSQL or SQLite for testing.