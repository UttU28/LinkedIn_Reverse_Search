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
pm2 delete link-backend >/dev/null 2>&1 || true
pm2 delete link-frontend >/dev/null 2>&1 || true
print_status "Cleanup completed"

# Install Backend Dependencies
print_header "📦 Installing Backend Dependencies..."
cd backend
if [ -f "package.json" ]; then
    print_status "Installing backend npm packages..."
    npm install --silent >/dev/null 2>&1 || npm install >/dev/null 2>&1
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
    pm2 start ecosystem.config.js >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Backend started successfully on port 9221"
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
    npm install --silent >/dev/null 2>&1 || npm install >/dev/null 2>&1
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
    pm2 start ecosystem.config.cjs >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Frontend started successfully on port 9220"
    else
        print_error "Failed to start frontend"
        exit 1
    fi
else
    print_error "Frontend ecosystem.config.cjs not found"
    exit 1
fi
cd ..

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save >/dev/null 2>&1

# ============================================
# Nginx Configuration Setup
# ============================================
echo ""
print_header "🌐 Nginx Configuration Setup"

# Domain configuration
DOMAIN="linkitup.thatinsaneguy.com"
NGINX_CONF_FILE="nginx-linkitup.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed. Skipping nginx setup."
    print_error "Install nginx: sudo pacman -S nginx (Arch) or sudo apt install nginx (Ubuntu/Debian)"
else
    # Check if running with sudo
    if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
        print_error "Not running as root. Nginx setup requires sudo."
        print_error "To set up nginx manually, run:"
        echo "  sudo cp $NGINX_CONF_FILE $NGINX_AVAILABLE"
        echo "  sudo ln -sf $NGINX_AVAILABLE $NGINX_ENABLED"
        echo "  sudo nginx -t && sudo systemctl reload nginx"
        echo "  printf '\nA\n1\n' | sudo certbot --nginx -d $DOMAIN"
    else
        # Check if nginx config file exists
        if [ ! -f "$NGINX_CONF_FILE" ]; then
            print_error "Nginx config file '$NGINX_CONF_FILE' not found!"
            print_error "Please ensure the nginx config file exists in the project root."
        else
            # Copy nginx config
            print_status "Copying nginx configuration..."
            cp "$NGINX_CONF_FILE" "$NGINX_AVAILABLE"
            
            # Enable the site
            print_status "Enabling nginx site..."
            ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
            
            # Remove default site if it exists
            rm -f /etc/nginx/sites-enabled/default
            
            # Test nginx configuration
            print_status "Testing nginx configuration..."
            if nginx -t >/dev/null 2>&1; then
                print_status "Nginx configuration is valid"
                print_status "Reloading nginx..."
                systemctl reload nginx >/dev/null 2>&1 || service nginx reload >/dev/null 2>&1 || true
                print_status "✅ Nginx configuration deployed"
            else
                print_error "Nginx configuration test failed!"
            fi
            
            # ============================================
            # SSL Certificate Setup
            # ============================================
            echo ""
            print_header "🔒 SSL Certificate Setup"
            
            # Check if certbot is installed
            if ! command -v certbot &> /dev/null; then
                print_status "Certbot is not installed. Installing certbot..."
                if command -v pacman &> /dev/null; then
                    # Arch Linux
                    pacman -Sy --noconfirm certbot certbot-nginx 2>/dev/null || {
                        print_error "Failed to install certbot. Please install manually: sudo pacman -S certbot certbot-nginx"
                    }
                elif command -v apt &> /dev/null; then
                    # Ubuntu/Debian
                    apt update && apt install -y certbot python3-certbot-nginx 2>/dev/null || {
                        print_error "Failed to install certbot. Please install manually: sudo apt install certbot python3-certbot-nginx"
                    }
                else
                    print_error "Could not determine package manager. Please install certbot manually."
                fi
            fi
            
            # Get SSL certificate
            if command -v certbot &> /dev/null; then
                print_status "Setting up SSL certificate..."
                print_status "If prompted to reinstall/renew certificate, automatically selecting option 1 (reinstall existing)..."
                
                # Run certbot with automatic selection of option 1 if prompted
                # First try non-interactive mode (works for new certs or valid existing certs)
                if certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --keep-until-expiring 2>/dev/null; then
                    print_status "✅ SSL certificate configured successfully"
                else
                    # If non-interactive fails, use interactive mode and pipe "1" to automatically select "reinstall existing certificate"
                    print_status "Running certbot with automatic selection of option 1 (reinstall existing)..."
                    # Handle prompts: email (skip/use existing), agreement (A), reinstall choice (1)
                    if printf "\nA\n1\n" | certbot --nginx -d ${DOMAIN} 2>/dev/null; then
                        print_status "✅ SSL certificate configured successfully"
                    else
                        print_error "⚠️  Certbot encountered an issue. This might be normal if certificate already exists."
                        print_error "You can manually run: printf '\nA\n1\n' | sudo certbot --nginx -d ${DOMAIN}"
                    fi
                fi
                
                # Test nginx configuration after SSL setup
                print_status "Testing nginx configuration after SSL setup..."
                if nginx -t >/dev/null 2>&1; then
                    print_status "Nginx configuration is valid"
                    systemctl reload nginx >/dev/null 2>&1 || service nginx reload >/dev/null 2>&1 || true
                    print_status "✅ Nginx reloaded with SSL configuration"
                else
                    print_error "Nginx configuration test failed after SSL setup!"
                fi
            fi
        fi
    fi
fi

# ============================================
# Final Summary
# ============================================
echo ""
print_header "✅ Deployment Complete!"
print_status "Backend: http://localhost:9221"
print_status "Frontend: http://localhost:9220"
if [ -n "$DOMAIN" ]; then
    print_status ""
    print_status "Public URLs:"
    print_status "  - Site: https://${DOMAIN}"
    print_status "  - API: https://${DOMAIN}/api/"
fi
print_status ""
print_status "Useful commands:"
echo "  pm2 status    - View application status"
echo "  pm2 logs      - View application logs"
echo "  pm2 stop all  - Stop all applications"
echo "  pm2 restart all - Restart all applications"
