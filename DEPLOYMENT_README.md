# 🚀 Fin-lytics Cloud Deployment Guide

This directory contains everything you need to deploy Fin-lytics to the cloud with your AI model included.

## 📋 Quick Start

### Option 1: Local Testing (Docker)
```bash
# Windows
./deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Google Cloud (Recommended - $300 free credit)
1. Follow `google_cloud_setup.md`
2. 3-7 months of free hosting
3. Reliable and fast

### Option 3: Oracle Cloud (Free Forever - if you can get capacity)
1. Follow `oracle_setup_guide.md`
2. Run `python oracle_retry.py`
3. Completely free forever (but hard to get)

## 📁 Files Overview

### Core Deployment Files
- `docker-compose.yml` - Multi-container orchestration
- `Dockerfile.backend` - Python FastAPI + AutoGluon container
- `Dockerfile.frontend` - React production container
- `nginx.conf` - Web server configuration

### Cloud Setup
- `google_cloud_setup.md` - Google Cloud deployment guide
- `startup.sh` - Google Cloud VM startup script
- `oracle_setup_guide.md` - Oracle Cloud instructions
- `oracle_retry.py` - Oracle Cloud capacity retry script

### Deployment Scripts
- `deploy.ps1` - Windows PowerShell deployment
- `deploy.sh` - Linux/Mac deployment script

### Configuration
- `.env` - Environment variables (auto-generated)
- `railway.toml` - Railway hosting config (alternative)
- `nixpacks.toml` - Build configuration

### Ignore Files (Important!)
- `.gitignore` - Excludes AI models from Git
- `.dockerignore` - Excludes unnecessary files from Docker
- `.railwayignore` - Excludes large files from Railway

## 🤖 AI Model Integration

Your AutoGluon model is automatically included and runs locally in the same container as your backend. No external API calls needed!

**Local Model Path:** `/app/AI_model/AutoGluonModels_*/`

**Fallback:** If model fails to load, the system uses intelligent fallback predictions.

## 💰 Cost Comparison

| Service | Cost | Duration | Pros | Cons |
|---------|------|----------|------|------|
| **Google Cloud** | $0 (free credit) | 3-7 months | Reliable, fast setup | Requires credit card |
| **Oracle Cloud** | $0 forever | Unlimited | Truly free | Hard to get capacity |
| **Railway** | $5/month | Ongoing | Easy deployment | No AI model (too big) |
| **Local Docker** | $0 | Unlimited | Full control | Not publicly accessible |

## 🛠️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend│
│   (Port 3000)   │◄──►│   (Port 8000)   │
│   - Nginx       │    │   - AutoGluon   │
│   - Production  │    │   - SQLite      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Docker Network
```

## 🔧 Environment Variables

Update `.env` with your real API keys:

```env
# Required for full functionality
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
STRIPE_SECRET_KEY=your_stripe_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Auto-generated (can customize)
SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///./data/finlytics.db
```

## 🚀 Production Deployment Steps

### Google Cloud (Recommended)
1. **Sign up:** https://cloud.google.com/ (get $300 credit)
2. **Install gcloud CLI**
3. **Run commands from `google_cloud_setup.md`**
4. **Access your app at the provided IP**

### Oracle Cloud (Free but challenging)
1. **Create account:** https://www.oracle.com/cloud/free/
2. **Install OCI CLI** 
3. **Update `oracle_retry.py` with your OCIDs**
4. **Run:** `python oracle_retry.py`
5. **Wait for capacity (can take days/weeks)**

## 📊 Monitoring & Maintenance

### Check Status
```bash
# Docker deployment
docker-compose ps
docker-compose logs -f

# Cloud deployment (SSH into VM)
docker ps
docker logs finlytics_backend_1
```

### Health Checks
- **Frontend:** http://your-ip:3000
- **Backend:** http://your-ip:8000/health
- **API Docs:** http://your-ip:8000/docs

### Updates
```bash
# Local
git pull origin main
docker-compose build
docker-compose up -d

# Cloud (SSH into VM)
cd /app
git pull origin main
docker-compose build
docker-compose up -d
```

## 🔒 Security Notes

1. **Change default JWT secret** in `.env`
2. **Use HTTPS** in production (Let's Encrypt + Nginx)
3. **Restrict database access**
4. **Keep API keys secure**
5. **Regular updates:** `docker-compose pull`

## 🆘 Troubleshooting

### Common Issues

**AI Model not loading:**
```bash
docker-compose logs backend | grep -i autogluon
```

**Frontend not accessible:**
```bash
docker-compose logs frontend
# Check if port 3000 is available
```

**Database errors:**
```bash
# Check if data directory exists and is writable
docker-compose exec backend ls -la /app/data/
```

### Getting Help
1. Check logs: `docker-compose logs [service]`
2. Verify environment: `docker-compose config`
3. Test connections: `docker-compose exec backend curl localhost:8000/health`

## 🎉 Success!

Once deployed, you'll have:
- ✅ Full-stack Fin-lytics application
- ✅ AI-powered stock predictions
- ✅ User authentication & data management
- ✅ Plaid banking integration
- ✅ Stripe payment processing
- ✅ Production-ready with SSL

**Total cost for 6+ months:** $0 (using free tiers) 🎊