# SSL and Nginx Configuration for LinkedIn Reverse Search

This document explains the setup of the Nginx reverse proxy with SSL to serve both frontend and backend applications from the same domain.

## Architecture Overview

- **Frontend**: Runs on port 3004, served at the root path (`api.amitluhar.com/`)
- **Backend**: Runs on port 3005, served at the `/api` path (`api.amitluhar.com/api/`)

## Nginx Configuration

The following configuration is used in `/etc/nginx/sites-available/api.amitluhar.com`:

```nginx
server {
    server_name api.amitluhar.com;

    # Frontend routes (serve at the root)
    location / {
        proxy_pass http://localhost:3004;  # Frontend runs on port 3004
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API routes (under /api path)
    location /api/ {
        proxy_pass http://localhost:3005/;  # Trailing slash removes /api from path
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.amitluhar.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.amitluhar.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = api.amitluhar.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name api.amitluhar.com;
    return 404; # managed by Certbot
}
```

## Setup Steps

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install -y nginx
   ```

2. Create the site configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/api.amitluhar.com
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.amitluhar.com /etc/nginx/sites-enabled/
   ```

4. Test the configuration:
   ```bash
   sudo nginx -t
   ```

5. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

6. Install Certbot and get SSL certificate:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.amitluhar.com
   ```

## How the Routing Works

- All requests to `https://api.amitluhar.com/` are routed to the frontend application running on port 3004
- All requests to `https://api.amitluhar.com/api/*` are routed to the backend application running on port 3005
- The trailing slash in `proxy_pass http://localhost:3005/;` removes the `/api` prefix from the URL before passing it to the backend
  - Example: A request to `https://api.amitluhar.com/api/login` is forwarded to `http://localhost:3005/login`

## Testing the Setup

1. Frontend access:
   ```bash
   curl https://api.amitluhar.com/
   ```

2. Backend API access:
   ```bash
   curl https://api.amitluhar.com/api/
   ```

3. Remove all Docker Conteners:
   ```bash
   docker stop $(docker ps -a -q)
   docker rm $(docker ps -a -q)
   docker rmi $(docker images -q)
   docker volume rm $(docker volume ls -q)
   docker network prune -f
   docker system prune -a -f
   ```

## Troubleshooting

- If you change the configuration, test it with `sudo nginx -t` and reload with `sudo systemctl reload nginx`
- Make sure ports 3004 and 3005 are accessible locally
- Verify both applications are running with `netstat -tulpn | grep LISTEN`