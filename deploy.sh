#!/usr/bin/env bash
# LinkedIn Reverse Search (LinkItUp) — PM2 backend + frontend + nginx/SSL
#
#   ./deploy.sh
#   sudo ./deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

step()   { echo -e "${BLUE}[linkitup]${NC} $*"; }
info()   { echo -e "${GREEN}[linkitup]${NC} $*"; }
warn()   { echo -e "${YELLOW}[linkitup]${NC} $*" >&2; }
err()    { echo -e "${RED}[linkitup]${NC} $*" >&2; }
banner() {
  echo ""
  echo -e "${CYAN}================================================================================${NC}"
  echo -e "${CYAN} $*${NC}"
  echo -e "${CYAN}================================================================================${NC}"
  echo ""
}

DOMAIN="linkitup.thatinsaneguy.com"
NGINX_CONF_FILE="nginx-linkitup.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

START_TS=$(date +%s)
banner "LinkItUp deploy"

if ! command -v pm2 &>/dev/null; then
  err "PM2 is not installed. Install: npm install -g pm2"
  exit 1
fi

banner "Cleanup"
step "Stopping existing link-backend and link-frontend…"
pm2 delete link-backend >/dev/null 2>&1 || true
pm2 delete link-frontend >/dev/null 2>&1 || true
info "Cleanup completed"

banner "Backend"
cd "${ROOT}/backend"
if [[ ! -f package.json ]]; then
  err "Backend package.json not found"
  exit 1
fi
step "Installing backend npm packages…"
npm install --silent >/dev/null 2>&1 || npm install >/dev/null 2>&1
if [[ ! -f ecosystem.config.js ]]; then
  err "Backend ecosystem.config.js not found"
  exit 1
fi
step "Starting backend (PM2)…"
pm2 start ecosystem.config.js >/dev/null 2>&1
info "Backend started on port 9221"

banner "Frontend"
cd "${ROOT}/frontend"
if [[ ! -f package.json ]]; then
  err "Frontend package.json not found"
  exit 1
fi
step "Installing frontend npm packages…"
npm install --silent >/dev/null 2>&1 || npm install >/dev/null 2>&1
if [[ ! -f ecosystem.config.cjs ]]; then
  err "Frontend ecosystem.config.cjs not found"
  exit 1
fi
step "Starting frontend (PM2)…"
pm2 start ecosystem.config.cjs >/dev/null 2>&1
info "Frontend started on port 9220"

cd "$ROOT"
step "Saving PM2 configuration…"
pm2 save >/dev/null 2>&1

banner "Nginx + SSL (${DOMAIN})"
if ! command -v nginx &>/dev/null; then
  warn "nginx not installed — skipping vhost/SSL"
  warn "Install: sudo pacman -S nginx  or  sudo apt install nginx"
elif [[ "${EUID:-$(id -u)}" -ne 0 && -z "${SUDO_USER:-}" ]]; then
  warn "Not root — nginx/SSL skipped. Run: sudo bash ${ROOT}/deploy.sh"
  warn "Manual nginx:"
  echo "  sudo cp ${NGINX_CONF_FILE} ${NGINX_AVAILABLE}"
  echo "  sudo ln -sf ${NGINX_AVAILABLE} ${NGINX_ENABLED}"
  echo "  sudo nginx -t && sudo systemctl reload nginx"
elif [[ ! -f "$NGINX_CONF_FILE" ]]; then
  err "Missing nginx config: ${NGINX_CONF_FILE}"
else
  step "Installing nginx vhost…"
  cp "$NGINX_CONF_FILE" "$NGINX_AVAILABLE"
  ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  rm -f /etc/nginx/sites-enabled/default

  step "nginx test + reload"
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx >/dev/null 2>&1 || service nginx reload >/dev/null 2>&1 || true
    info "Nginx configured"
  else
    err "nginx -t failed"
  fi

  if command -v certbot &>/dev/null; then
    step "Certbot: ${DOMAIN}"
    if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --keep-until-expiring 2>/dev/null; then
      info "SSL certificate configured"
    elif printf '\nA\n1\n' | certbot --nginx -d "${DOMAIN}" 2>/dev/null; then
      info "SSL certificate configured"
    else
      warn "Certbot issue for ${DOMAIN} — check manually"
    fi
    nginx -t >/dev/null 2>&1 && (systemctl reload nginx >/dev/null 2>&1 || service nginx reload >/dev/null 2>&1 || true)
  else
    warn "certbot not installed — HTTP vhost only"
  fi
fi

ELAPSED=$(( $(date +%s) - START_TS ))
banner "Deploy summary (${ELAPSED}s)"
info "All requested steps completed."

cat <<EOF

Live URLs:
  Site:  https://${DOMAIN}
  API:   https://${DOMAIN}/api/

Useful commands:
  pm2 status
  pm2 logs
  pm2 restart link-backend link-frontend
EOF
