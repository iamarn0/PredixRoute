#!/usr/bin/env bash
# PredixRoute — one-command deploy on a Linux VM (Oracle / DigitalOcean / etc.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example to .env and fill in secrets first."
  exit 1
fi

echo "==> Building and starting PredixRoute (production)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Waiting for backend health..."
for i in {1..30}; do
  if curl -sf http://localhost/api/v1/health >/dev/null 2>&1; then
    echo "==> Deploy OK — open http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VM_IP')"
    exit 0
  fi
  sleep 5
done

echo "==> Health check timed out. Check logs: docker compose logs -f backend"
exit 1
