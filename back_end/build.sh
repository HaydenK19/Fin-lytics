#!/bin/bash
# Build script for Railway full-stack deployment

echo "🏗️  Building Finlytics Full-Stack Application..."

# Build frontend
echo "📦 Building React frontend..."
cd /app
npm install
npm run build

# Move built files to where backend can serve them
echo "📁 Setting up static file serving..."
ls -la dist/

# Install backend dependencies
echo "🐍 Installing Python backend dependencies..."
cd /app/back_end
pip install -r requirements.txt

echo "✅ Build completed successfully!"