#!/bin/bash

# Fin-lytics Cloud Deployment Script
# Supports both Google Cloud and Oracle Cloud deployment

set -e

echo "🚀 Fin-lytics Cloud Deployment Script"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
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
EOF
    echo "✅ Created .env file. Please update with your real API keys!"
else
    echo "✅ .env file already exists"
fi

# Build and start the application
echo "🏗️  Building Docker images..."
docker-compose build

echo "🚀 Starting Fin-lytics application..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 SUCCESS! Fin-lytics is now running!"
    echo ""
    echo "📊 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "🔍 Check service status:"
    echo "   docker-compose ps"
    echo ""
    echo "📝 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "⏹️  Stop the application:"
    echo "   docker-compose down"
    echo ""
    
    # Check AI model status
    echo "🤖 Checking AI model status..."
    sleep 5
    curl -s http://localhost:8000/health 2>/dev/null | grep -q "healthy" && echo "✅ AI model is loaded and ready" || echo "⚠️  AI model not loaded - check logs with: docker-compose logs backend"
    
else
    echo "❌ Something went wrong. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi

echo ""
echo "🔧 Next steps:"
echo "1. Update .env file with your real API keys (Plaid, Stripe, Email)"
echo "2. For production deployment:"
echo "   - Use Google Cloud: See google_cloud_setup.md"
echo "   - Use Oracle Cloud: Run python oracle_retry.py"
echo "3. Configure SSL certificate for HTTPS"
echo "4. Set up domain name"