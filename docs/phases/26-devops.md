# Phase 26 — DevOps

## Dockerfiles

### Backend

```dockerfile
# infrastructure/docker/Dockerfile.backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S predixroute && adduser -S predixroute -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER predixroute
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
```

### AI Service

```dockerfile
# infrastructure/docker/Dockerfile.ai-service
FROM python:3.11-slim AS production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m predixroute
USER predixroute
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/internal/v1/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### Frontend

```dockerfile
# infrastructure/docker/Dockerfile.frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Nginx Architecture

```nginx
# infrastructure/nginx/conf.d/predixroute.conf
upstream backend {
    least_conn;
    server backend:3000 max_fails=3 fail_timeout=30s;
}

upstream ai_service {
    server ai-service:8000 max_fails=3 fail_timeout=30s;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

server {
    listen 443 ssl http2;
    server_name api.predixroute.com;

    ssl_certificate /etc/ssl/certs/predixroute.crt;
    ssl_certificate_key /etc/ssl/private/predixroute.key;

    # Public API
    location /api/v1/public/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 1m;
    }

    # Dashboard API
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10m;
    }

    # Block direct AI service access
    location /ai/ {
        return 403;
    }
}

server {
    listen 443 ssl http2;
    server_name app.predixroute.com;

    ssl_certificate /etc/ssl/certs/predixroute.crt;
    ssl_certificate_key /etc/ssl/private/predixroute.key;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## GitHub Actions CI/CD

### CI Pipeline (on PR)

```yaml
# .github/workflows/ci-backend.yml
name: Backend CI
on:
  pull_request:
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports: ['27017:27017']
      redis:
        image: redis:7.2
        ports: ['6379:6379']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: backend/package-lock.json }

      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run test:coverage
      - run: cd backend && npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with: { directory: backend/coverage }
```

### Deploy Pipeline (on main merge)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: ap-south-1

      - name: Build and push Docker images
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker compose build
          docker tag predixroute-backend $ECR_REGISTRY/predixroute-backend:$GITHUB_SHA
          docker tag predixroute-ai-service $ECR_REGISTRY/predixroute-ai-service:$GITHUB_SHA
          docker push $ECR_REGISTRY/predixroute-backend:$GITHUB_SHA
          docker push $ECR_REGISTRY/predixroute-ai-service:$GITHUB_SHA

      - name: Deploy to EC2 ASG
        run: |
          aws autoscaling start-instance-refresh \
            --auto-scaling-group-name predixroute-prod-asg \
            --strategy Rolling

      - name: Run smoke tests
        run: |
          sleep 60
          curl -f https://api.predixroute.com/api/v1/public/health
```

## AWS Deployment Strategy

### Infrastructure

| Resource | Spec | Purpose |
|----------|------|---------|
| EC2 ASG | 2–10 × t3.large | Application servers |
| ALB | HTTPS listener | Load balancing |
| Route 53 | api.* + app.* | DNS |
| S3 | predixroute-prod-assets | Datasets, reports, models |
| ElastiCache | r6g.large Redis cluster | Cache + BullMQ |
| MongoDB Atlas | M30 replica set | Primary database |
| CloudWatch | Logs + Metrics + Alarms | Observability |
| Secrets Manager | All secrets | Secure config |
| ACM | SSL certificates | TLS |

### EC2 User Data

```bash
#!/bin/bash
# infrastructure/aws/user-data.sh
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

# Pull latest images from ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Fetch secrets
aws secretsmanager get-secret-value --secret-id predixroute/prod --query SecretString --output text > /opt/predixroute/.env

# Start services
cd /opt/predixroute
docker compose pull
docker compose up -d

# CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
```

### Rolling Deployment

1. Build new Docker images → push to ECR
2. Trigger ASG instance refresh (rolling, 50% min healthy)
3. New instances pull latest images, start services
4. ALB health checks verify `/api/v1/health`
5. Old instances drained and terminated
6. Smoke tests run against production endpoints

## CloudWatch Setup

### Log Groups

```
/predixroute/production/backend
/predixroute/production/ai-service
/predixroute/production/nginx
/predixroute/production/workers
```

Retention: 30 days (production), 7 days (staging).

### Dashboards

- **API Overview:** Request count, latency percentiles, error rate
- **ML Performance:** Prediction count, latency, model version distribution
- **Infrastructure:** CPU, memory, disk, network per EC2 instance
- **Jobs:** Queue depths, job durations, failure rates

## Environment Promotion

```
feature branch → PR → CI tests pass → merge to main
  → Auto-deploy to staging → Manual QA
  → Tag release → Deploy to production (GitHub Actions manual approval)
```

## Disaster Recovery

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| EC2 failure | 5 min | 0 | ASG auto-replaces instance |
| MongoDB failure | 15 min | 1 hour | Atlas automatic failover |
| Redis failure | 10 min | 0 (AOF) | ElastiCache failover |
| Region outage | 4 hours | 1 hour | Restore Atlas backup to secondary region |
| Data corruption | 2 hours | 1 hour | Point-in-time restore from Atlas |
