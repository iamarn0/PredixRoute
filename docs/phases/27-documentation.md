# Phase 27 — Documentation

## Documentation Index

All documentation lives in the `docs/` directory of the monorepo.

### Architecture Docs

| Document | Path | Description |
|----------|------|-------------|
| High-Level Architecture | `docs/phases/01-high-level-architecture.md` | System context, service architecture, deployment |
| Monorepo Structure | `docs/phases/02-monorepo-structure.md` | Complete folder tree |
| Database Design | `docs/phases/03-database-design.md` | All 16 collections with schemas, indexes |
| Backend Architecture | `docs/phases/05-backend-architecture.md` | Controller-Service-Repository pattern |
| Frontend Architecture | `docs/phases/20-frontend-architecture.md` | React modules, routing, theming |
| Security | `docs/phases/22-security.md` | Security layers, threat model |
| Performance | `docs/phases/23-performance.md` | Caching, indexing, pooling |
| Observability | `docs/phases/24-observability.md` | Logging, metrics, health checks |

### ER Diagrams

| Diagram | Path |
|---------|------|
| Entity Relationship | `docs/diagrams/er-diagram.mmd` |
| System Context | `docs/diagrams/system-context.mmd` |
| Deployment | `docs/diagrams/deployment.mmd` |

### OpenAPI Specs

| Spec | Path | Endpoints |
|------|------|-----------|
| Public API | `docs/openapi/public-api.yaml` | 6 public endpoints |
| Dashboard API | `docs/openapi/dashboard-api.yaml` | 40+ dashboard endpoints |

Swagger UI served at:
- Development: `http://localhost:3000/api/docs`
- Production: `https://api.predixroute.com/api/docs`

### Guides

| Guide | Path | Audience |
|-------|------|----------|
| Getting Started | `docs/guides/getting-started.md` | New developers |
| Authentication | `docs/guides/authentication.md` | Integrators + frontend devs |
| ML Pipeline | `docs/guides/ml-pipeline.md` | ML engineers |
| Webhooks | `docs/guides/webhooks.md` | Integrators |
| SDK (Node.js) | `docs/guides/sdk-nodejs.md` | Node.js developers |
| SDK (Python) | `docs/guides/sdk-python.md` | Python developers |
| Deployment | `docs/guides/deployment.md` | DevOps engineers |

---

## Getting Started Guide (Summary)

```markdown
# Getting Started with PredixRoute

## Prerequisites
- Node.js 20+, Python 3.11+, Docker, MongoDB, Redis

## Local Development
1. Clone repository
2. Copy .env.example to .env in each package
3. docker compose up -d mongodb redis
4. cd backend && npm install && npm run dev
5. cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload
6. cd frontend && npm install && npm run dev

## First Steps
1. Register at http://localhost:5173/auth/register
2. Verify email (check console logs in dev)
3. Upload a dataset (CSV with shipment history)
4. Train a model
5. Activate the model
6. Run your first prediction
7. Generate an API key and test the public API
```

## Authentication Guide (Summary)

```markdown
# Authentication Guide

## Dashboard Authentication
- Register → Email verification → Login
- JWT access token (15 min) in httpOnly cookie
- Refresh token (7 days) rotated on each refresh
- CSRF token required for state-changing requests

## Public API Authentication
- Generate API key in dashboard (ORG_ADMIN)
- Pass as header: X-API-Key: prx_live_xxx
- Keys scoped to organization with plan-based rate limits

## SDK Authentication
- Pass API key to SDK constructor
- SDK handles headers, retries, error parsing
```

## ML Pipeline Guide (Summary)

```markdown
# ML Pipeline Guide

## Workflow
1. Upload CSV dataset (min 100 rows, quality score ≥ 70)
2. Confirm column mapping
3. Wait for processing (status: READY)
4. Start training (trains LR, RF, XGBoost in parallel)
5. Review metrics comparison
6. Activate best model (status: STAGING → ACTIVE)
7. Predictions now use active model

## Feature Engineering
28 features across pincode, courier, COD, weight, address, temporal categories.
See docs/phases/08-feature-engineering.md for details.

## Model Selection
Best F1 on test set wins. Minimum F1 ≥ 0.65, AUC ≥ 0.70.
```

## Webhook Guide (Summary)

```markdown
# Webhook Guide

## Setup
1. Create webhook in dashboard with HTTPS URL
2. Select events to subscribe
3. Save the signing secret (shown once)

## Verification
Verify X-PredixRoute-Signature header using HMAC-SHA256.
See docs/phases/16-webhooks.md for code examples.

## Events
prediction.created, model.trained, dataset.processed,
report.generated, api.limit.reached
```

## Deployment Guide (Summary)

```markdown
# Deployment Guide

## Environments
- dev: Docker Compose locally
- staging: Single EC2 + Atlas M10
- production: ASG (2-10 EC2) + Atlas M30 + Redis Cluster

## Deploy Steps
1. Merge to main → CI runs tests
2. GitHub Actions builds Docker images → ECR
3. ASG instance refresh (rolling deployment)
4. Smoke tests verify health endpoints
5. Monitor CloudWatch for 15 minutes

## Rollback
Re-deploy previous Docker image tag via GitHub Actions.
Model rollback via dashboard (separate from code rollback).
```

---

## API Documentation (Swagger)

Backend serves auto-generated Swagger UI from JSDoc annotations:

```typescript
/**
 * @swagger
 * /api/v1/public/risk/evaluate:
 *   post:
 *     summary: Evaluate shipment delivery risk
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiskEvaluateRequest'
 *     responses:
 *       200:
 *         description: Risk evaluation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskEvaluateResponse'
 */
```

## Documentation Maintenance

- Architecture docs updated with each major feature release
- OpenAPI specs auto-validated in CI (`swagger-cli validate`)
- Guides reviewed quarterly
- ER diagram updated when collections change
- Changelog maintained in root `CHANGELOG.md`
