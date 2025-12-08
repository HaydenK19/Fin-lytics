# Fin-lytics Cloud Deployment Script for Windows
# PowerShell version

Write-Host "🚀 Fin-lytics Cloud Deployment Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Desktop with Compose." -ForegroundColor Red
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Database
DATABASE_URL=sqlite:///./data/finlytics.db

# JWT Secret (CHANGE THIS IN PRODUCTION)
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-12345

# Plaid Configuration (Add your real keys)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Stripe Configuration (Add your real keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# React App Configuration
REACT_APP_API_URL=http://localhost:8000
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Created .env file. Please update with your real API keys!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Build and start the application
Write-Host "🏗️  Building Docker images..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Starting Fin-lytics application..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$runningServices = docker-compose ps --services --filter "status=running"
if ($runningServices) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Fin-lytics is now running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Access your application:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Check service status:" -ForegroundColor Cyan
    Write-Host "   docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 View logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "⏹️  Stop the application:" -ForegroundColor Cyan
    Write-Host "   docker-compose down" -ForegroundColor White
    Write-Host ""
    
    # Check AI model status
    Write-Host "🤖 Checking AI model status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
        if ($healthCheck.status -eq "healthy") {
            Write-Host "✅ AI model is loaded and ready" -ForegroundColor Green
        } else {
            Write-Host "⚠️  AI model not loaded - check logs with: docker-compose logs backend" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not check AI model status - check logs with: docker-compose logs backend" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Something went wrong. Check the logs:" -ForegroundColor Red
    Write-Host "   docker-compose logs" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your real API keys (Plaid, Stripe, Email)" -ForegroundColor White
Write-Host "2. For production deployment:" -ForegroundColor White
Write-Host "   - Use Google Cloud: See google_cloud_setup.md" -ForegroundColor White
Write-Host "   - Use Oracle Cloud: Run python oracle_retry.py" -ForegroundColor White
Write-Host "3. Configure SSL certificate for HTTPS" -ForegroundColor White
Write-Host "4. Set up domain name" -ForegroundColor White