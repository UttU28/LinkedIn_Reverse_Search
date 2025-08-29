#!/bin/bash

# LinkedIn Reverse Search Deployment Script
echo "🚀 Starting LinkedIn Reverse Search Application..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install PM2 first:"
    echo "npm install -g pm2"
    exit 1
fi

# Stop and remove existing instances
print_header "🧹 Cleaning up existing services..."
print_status "Stopping and removing existing link-backend and link-frontend processes..."
pm2 delete link-backend 2>/dev/null || print_status "link-backend not running"
pm2 delete link-frontend 2>/dev/null || print_status "link-frontend not running"
print_status "Cleanup completed"

# Install Backend Dependencies
print_header "📦 Installing Backend Dependencies..."
cd backend
if [ -f "package.json" ]; then
    print_status "Installing backend npm packages..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_status "Backend dependencies installed successfully"
else
    print_error "Backend package.json not found"
    exit 1
fi

# Start Backend
print_header "🚀 Starting Backend..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    if [ $? -eq 0 ]; then
        print_status "Backend started successfully on port 3008"
    else
        print_error "Failed to start backend"
        exit 1
    fi
else
    print_error "Backend ecosystem.config.js not found"
    exit 1
fi
cd ..

# Install Frontend Dependencies
print_header "🎨 Installing Frontend Dependencies..."
cd frontend
if [ -f "package.json" ]; then
    print_status "Installing frontend npm packages..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    print_status "Frontend dependencies installed successfully"
else
    print_error "Frontend package.json not found"
    exit 1
fi

# Start Frontend
print_header "🚀 Starting Frontend..."
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
    if [ $? -eq 0 ]; then
        print_status "Frontend started successfully on port 3009"
    else
        print_error "Failed to start frontend"
        exit 1
    fi
else
    print_error "Frontend ecosystem.config.cjs not found"
    exit 1
fi
cd ..

# Show PM2 status
print_header "📊 Application Status:"
pm2 status

print_header "✅ Deployment Complete!"
print_status "Backend: http://localhost:3008"
print_status "Frontend: http://localhost:3009"
print_status ""
print_status "Useful commands:"
echo "  pm2 status    - View application status"
echo "  pm2 logs      - View application logs"
echo "  pm2 stop all  - Stop all applications"
echo "  pm2 restart all - Restart all applications"
