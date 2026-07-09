# PredixRoute

**AI-Powered Logistics Intelligence Platform & API Infrastructure**

PredixRoute enables logistics companies, shipping aggregators, ecommerce platforms, courier providers, OMS/ERP/WMS systems to make intelligent shipping decisions using machine learning.

## Architecture Overview

```
Frontend (React/Vite) → Node.js API Gateway → MongoDB / Redis / BullMQ
                              ↓
                    AI Service (FastAPI) → ML Models → SHAP Explainability
```

**Critical Rule:** Frontend never calls AI Service directly. All traffic flows through Backend APIs.

## Monorepo Structure

| Package | Stack | Purpose |
|---------|-------|---------|
| `frontend/` | React, Vite, MUI, TanStack Query | Multi-tenant SaaS Dashboard |
| `backend/` | Node.js, Express, TypeScript | API Gateway, Auth, Orchestration |
| `ai-service/` | Python, FastAPI, XGBoost, SHAP | Internal ML inference & training |
| `infrastructure/` | Docker, Nginx, GitHub Actions | Deployment & CI/CD |
| `docs/` | Architecture, API, ML guides | Implementation documentation |

## Implementation Status

| Slice | Status | Description |
|-------|--------|-------------|
| **Slice 1 (current)** | Implemented | Backend core, auth, public health + risk API, AI inference service |
| **Slice 2 (current)** | Implemented | Dashboard APIs, pincode/courier intelligence, API keys, React UI |
| Slice 3 | Planned | Dataset upload, BullMQ jobs, model training |
| Slice 4 | Planned | Webhooks, SDKs, analytics dashboards |

### Slice 2 — What's Running

**Dashboard API** (JWT cookie auth):

| Method | Path | Role |
|--------|------|------|
| POST | `/dashboard/predictions/evaluate` | ANALYST+ |
| GET | `/dashboard/predictions` | ANALYST+ |
| GET | `/dashboard/predictions/:id` | ANALYST+ |
| GET | `/dashboard/pincodes` | ANALYST+ |
| GET | `/dashboard/pincodes/:pincode` | ANALYST+ |
| GET | `/dashboard/couriers` | ANALYST+ |
| GET | `/dashboard/couriers/:code` | ANALYST+ |
| GET | `/dashboard/api-keys` | ORG_ADMIN |
| POST | `/dashboard/api-keys` | ORG_ADMIN |
| DELETE | `/dashboard/api-keys/:id` | ORG_ADMIN |

**Public API additions:**

| Method | Path | Scope |
|--------|------|-------|
| GET | `/public/pincode/:pincode` | `pincode:read` |
| GET | `/public/courier/:courier` | `courier:read` |

**Frontend** (`http://localhost:5173`):

- **Marketing site:** `/` (home), `/features`, `/pricing`, `/about`
- **Customer portal:** `/customer/auth/login`, `/customer/auth/register` — dashboard at `/app`
- **Platform admin portal:** `/admin/auth/login`, `/admin/auth/register` — console at `/admin`
- Risk evaluation form with SHAP explanations
- Prediction history
- Pincode intelligence table
- API key management (create + revoke)

```powershell
# Seed demo accounts + pincode/courier intelligence
cd backend
npm run seed

# Terminal 3 — Frontend
cd frontend
npm run dev
```

### Slice 1 — What's Running

- **Backend:** Express API with JWT auth, API key auth, tenant-scoped repositories
- **Public API:** `POST /api/v1/public/risk/evaluate`, `GET /api/v1/public/health`
- **Auth:** `POST /api/v1/auth/register|login|refresh|logout`, `GET /api/v1/auth/me`
- **AI Service:** Internal FastAPI inference with feature pipeline + courier ranking

### Local Development (Slice 1)

```powershell
# 1. Start MongoDB + Redis (requires Docker)
docker compose up -d mongodb redis

# 2. Backend (API + background workers)
cd backend
Copy-Item .env.example .env
npm install
npm run dev

# 3. AI Service (separate terminal)
cd ai-service
Copy-Item .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Seed demo data
npx tsx infrastructure/scripts/seed-dev-data.ts
```

**Demo credentials after seed:**
- Login: `admin@demo-logistics.com` / `Demo@123456`
- API Key: `prx_test_demo_seed_key_for_local_dev_only`

**Test risk evaluation:**
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/public/risk/evaluate" `
  -Headers @{ "X-API-Key" = "prx_test_demo_seed_key_for_local_dev_only"; "Content-Type" = "application/json" } `
  -Body '{"destinationPincode":"110001","weightGrams":500,"cod":true,"codAmount":1499,"orderValue":1499,"addressQualityScore":0.72,"availableCouriers":["delhivery","bluedart","dtdc"]}'
```

## Quick Start (Development)

```powershell
# Clone and install
docker compose up -d mongodb redis
cd backend; npm install; npm run dev   # API + BullMQ workers
cd ai-service; pip install -r requirements.txt; uvicorn app.main:app --reload
cd frontend; npm install; npm run dev
```

## Documentation Index

| Phase | Document |
|-------|----------|
| 1 | [High-Level Architecture](docs/phases/01-high-level-architecture.md) |
| 2 | [Monorepo Structure](docs/phases/02-monorepo-structure.md) |
| 3 | [Database Design](docs/phases/03-database-design.md) |
| 4 | [Authentication & Authorization](docs/phases/04-authentication-authorization.md) |
| 5 | [Backend Architecture](docs/phases/05-backend-architecture.md) |
| 6 | [API Design](docs/phases/06-api-design.md) |
| 7 | [Dataset Management](docs/phases/07-dataset-management.md) |
| 8 | [Feature Engineering](docs/phases/08-feature-engineering.md) |
| 9 | [Machine Learning Architecture](docs/phases/09-machine-learning.md) |
| 10 | [Model Registry](docs/phases/10-model-registry.md) |
| 11 | [Shipment Risk Engine](docs/phases/11-shipment-risk-engine.md) |
| 12 | [Courier Recommendation Engine](docs/phases/12-courier-recommendation.md) |
| 13 | [Pincode Intelligence](docs/phases/13-pincode-intelligence.md) |
| 14 | [Courier Intelligence](docs/phases/14-courier-intelligence.md) |
| 15 | [Explainable AI](docs/phases/15-explainable-ai.md) |
| 16 | [Webhook Infrastructure](docs/phases/16-webhooks.md) |
| 17 | [SDK Design](docs/phases/17-sdk-design.md) |
| 18 | [Analytics Dashboards](docs/phases/18-analytics-dashboards.md) |
| 19 | [Reporting](docs/phases/19-reporting.md) |
| 20 | [Frontend Architecture](docs/phases/20-frontend-architecture.md) |
| 21 | [Background Jobs](docs/phases/21-background-jobs.md) |
| 22 | [Security](docs/phases/22-security.md) |
| 23 | [Performance](docs/phases/23-performance.md) |
| 24 | [Observability](docs/phases/24-observability.md) |
| 25 | [Testing](docs/phases/25-testing.md) |
| 26 | [DevOps](docs/phases/26-devops.md) |
| 27 | [Documentation](docs/phases/27-documentation.md) |

## License

Proprietary — PredixRoute © 2026
