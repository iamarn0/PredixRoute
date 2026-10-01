# PredixRoute

## AI-Powered Logistics Intelligence Platform

PredixRoute is an AI-powered logistics intelligence platform that predicts shipment RTO risk, analyzes shipment and address signals, evaluates courier performance, recommends suitable courier options, and exposes logistics intelligence through dashboards and APIs.

RTO means Return to Origin. The platform scores the chance that a shipment will not be delivered and will be returned, then supports the operational decision that follows.

The frontend never calls the AI service directly. Dashboard and public API traffic goes through the Node.js API.

## What PredixRoute Does

Incomplete addresses, cash-on-delivery orders, and uneven courier performance make some shipments more likely to return to origin. PredixRoute scores that risk before dispatch and keeps the result, the contributing factors, and the courier ranking in one place.

Logistics teams can:

- predict RTO risk for a single shipment
- read the factors behind a score
- look up pincode performance
- look up courier performance
- rank the couriers available for an order
- check address completeness
- run predictions one at a time or from an uploaded file
- call the same capabilities from an API key

## Core Intelligence

```text
Shipment
    ↓
Feature engineering
    ↓
Pincode / address / courier / order signals
    ↓
ML prediction
    ↓
RTO risk
    ↓
Explainability
    ↓
Operational decision support
```

A prediction request carries the destination pincode, optional delivery address, weight, order value, COD flag and amount, and the couriers the caller wants ranked. The API attaches organization pincode and courier history when it exists, scores the address, and sends the payload to the internal AI service. The response includes delivery probability, an RTO risk score, a risk level, a recommended courier, courier rankings, and explanations.

## Platform Architecture

```mermaid
flowchart TD
  react["React / Vite dashboard"] --> api["Node.js / Express API"]
  api --> mongo["MongoDB"]
  api --> redis["Redis"]
  api --> workers["BullMQ workers"]
  workers --> redis
  workers --> mongo
  api --> ai["Python FastAPI AI service"]
  workers --> ai
  ai --> models["XGBoost models"]
```

| Component | Role |
|-----------|------|
| `frontend/` | Marketing site, customer portal, platform admin console |
| `backend/` | API gateway, auth, tenancy, orchestration, job producers |
| `ai-service/` | Internal inference, training, and model registry |
| `infrastructure/` | Dockerfiles, Nginx, local Mongo init, deploy script |
| MongoDB | Organizations, users, predictions, intelligence, jobs |
| Redis | Connections for rate limits, quotas, and BullMQ |
| Nginx | Edge proxy in the Compose stack |

## RTO Prediction

Each evaluation returns:

| Field | Meaning |
|-------|---------|
| `deliveryProbability` | Estimated chance of successful delivery, from 0 to 1 |
| `riskScore` | RTO risk from 0 to 100, derived as `(1 - delivery probability) × 100` |
| `riskLevel` | `LOW` below 25, `MEDIUM` below 50, `HIGH` below 75, otherwise `CRITICAL` |
| `recommendedCourier` | Highest-ranked courier from the list supplied on the request |
| `courierRankings` | Score and success probability for each supplied courier |
| `explanations` | Feature-level factors for the score |
| `modelVersion` | Model version recorded with the prediction |

Signals used in the feature pipeline include pincode risk, success rate, RTO rate, average delivery days, and tier; courier success rates; COD flag, amount relative to order value, and COD amount bucket; order value; weight; address quality and address issue count; and day of week.

This repository does not publish a fixed model accuracy. A training run reports accuracy and F1 for that dataset only.

Predictions are stored per organization and can be listed from the dashboard. Sources recorded on a prediction are `DASHBOARD`, `PUBLIC_API`, `BATCH`, and `DEMO`.

## Explainable Predictions

The AI service loads an XGBoost model and a SHAP `TreeExplainer`. For each prediction it returns explanation rows with the feature name, value, impact, direction, and a short description. If SHAP values are not available for that call, the service falls back to rule-based explanations built from the same features, including pincode risk, address quality, and COD.

## Pincode Intelligence

Pincode records are organization-scoped. Each record stores state, city, tier (`METRO`, `TIER1`, `TIER2`, `TIER3`, `RURAL`), and metrics:

- total shipments
- success rate
- RTO rate
- average delivery days
- risk score
- COD risk score

A record can also include a per-courier breakdown, best and worst courier, and a trend of success rate and risk score.

The customer portal lists pincodes at `/app/pincodes`. The public API exposes `GET /api/v1/public/pincode/:pincode` with the `pincode:read` scope.

## Courier Intelligence

Courier performance is stored per organization and courier code. Metrics include shipment counts, delivered and RTO counts, success rate, RTO rate, average and 90th-percentile delivery days, COD success rate, and average cost per kilogram. Records can also hold trend points and the strongest and weakest pincodes for that courier.

The public API exposes `GET /api/v1/public/courier/:courier` with the `courier:read` scope. The dashboard API exposes list and detail routes for organization admins and analysts.

Courier recommendation ranks only the couriers sent on the prediction request. The ranker blends delivery probability with courier success, RTO, delivery time, and cost. When the organization has no history for a code, the feature pipeline uses built-in fallback rates. Those fallbacks are priors in code, not live connections to courier networks.

## Address Intelligence

If a delivery address is present, the API analyzes it before inference. The analysis checks:

- address length and word count
- a house, flat, or door number
- a street, colony, sector, or similar locality
- a landmark phrase
- whether a 6-digit pincode inside the address matches the destination pincode
- whether the address is split into multiple components

The result is an `addressQualityScore` from 0 to 1, plus `addressAnalysis` with match flags, issues, and strengths. That score and the issue list are features in the model input. Callers may also pass an address quality score directly when no address text is sent.

## Bulk Prediction

Organization admins and analysts can upload a spreadsheet from `/app/bulk-predictions`. The API accepts the file, stores the job, and enqueues it on the `bulk-prediction` BullMQ queue. Workers process rows and write an output file.

Job status is `QUEUED`, `PROCESSING`, `COMPLETED`, or `FAILED`. The dashboard can list jobs, poll a job, download a template, and download the result. The public API also accepts a JSON batch at `POST /api/v1/public/batch/evaluate` with the `batch` scope.

## COD Verification

COD verification is an optional follow-up for cash-on-delivery shipments. An organization can enable it and choose which risk levels start a session, plus expiry and turn limits.

When Twilio WhatsApp credentials and an OpenAI API key are configured, the messaging worker opens a WhatsApp conversation and uses the model to interpret replies. Sessions can be confirmed, rejected, expired, or marked for review. Organization admins can resolve a session from the dashboard. Inbound WhatsApp messages are received at `POST /api/v1/webhooks/twilio/whatsapp`.

Without those credentials, the verification records and dashboard still exist, but outbound WhatsApp messages are not sent.

Related API routes include `POST /api/v1/public/cod-verifications/start`, `GET /api/v1/public/cod-verifications/:id`, and `POST /api/v1/public/risk/evaluate-and-verify` (`cod:verify` scope).

## ML Lifecycle

```text
Dataset / training data
        ↓
Feature processing
        ↓
Training
        ↓
Evaluation
        ↓
Model artifact
        ↓
Inference
```

What the repository implements:

- Platform admins upload a training CSV, download a template, and start training from `/admin/training`.
- Organizations can consent to training-data use, upload contribution files, and trigger a sync. Platform admins approve, reject, or merge contributions.
- A training-data sync worker runs scheduled sync jobs.
- The AI service trains an `XGBClassifier` from a processed CSV of at least 100 rows, with a stratified train/test split. It records accuracy, F1, sample count, and model id, then writes a joblib artifact.
- The model registry loads a bootstrap model on startup when configured, and can reload an organization-specific model after training.
- Inference uses that registry. The public internet does not call the training or predict routes; those routes require the internal service token.

Shipment outcomes can also be ingested at `POST /api/v1/public/shipments/outcome` for organizations that contribute labeled results.

## API Platform

Authentication for customer and admin apps is a JWT access token plus an HTTP-only refresh cookie. Programmatic access uses an `X-API-Key` header. Keys are stored as a hash, can be `LIVE` or `TEST`, and are revocable.

Scopes:

| Scope | Used for |
|-------|----------|
| `risk:evaluate` | Single risk evaluation and shipment-outcome ingest |
| `recommendation` | Declared on keys; recommendation is returned with risk evaluation |
| `batch` | JSON batch evaluation |
| `pincode:read` | Pincode lookup |
| `courier:read` | Courier lookup |
| `cod:verify` | COD verification and evaluate-and-verify |

Usage limits come from the organization's API plan, with defaults of 60 requests per minute, 500 predictions per day, and 10,000 API calls per month. A key may override the per-minute limit. Counters live in Redis. The usage screen is `/app/usage`.

Public prediction and intelligence routes are under `/api/v1/public`. Interactive OpenAPI UI is served at `/api/v1/docs` when `NODE_ENV` is not `production`, and the spec is at `/api/v1/openapi.json`. The in-app developer portal at `/app/developers` documents the public API and can build a Postman collection. A checked-in OpenAPI file also lives at `docs/openapi/public-api.yaml`.

Webhooks are registered per organization with a URL, a secret, and one or more events:

- `prediction.completed`
- `prediction.batch_completed`
- `cod.verification.started`
- `cod.verification.confirmed`
- `cod.verification.rejected`
- `cod.verification.expired`
- `cod.verification.needs_review`

The webhook worker signs the body with HMAC-SHA256 and sends `X-PredixRoute-Signature`, `X-PredixRoute-Timestamp`, and `X-PredixRoute-Event`.

Representative routes:

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/v1/health` | Deep health |
| GET | `/api/v1/public/health` | Public health summary |
| POST | `/api/v1/public/demo/risk/evaluate` | Demo rate limit, no API key |
| POST | `/api/v1/public/risk/evaluate` | `risk:evaluate` |
| POST | `/api/v1/public/batch/evaluate` | `batch` |
| GET | `/api/v1/public/pincode/:pincode` | `pincode:read` |
| GET | `/api/v1/public/courier/:courier` | `courier:read` |
| POST | `/api/v1/auth/user/register` and `/api/v1/auth/user/login` | Customer auth |
| POST | `/api/v1/auth/admin/register` and `/api/v1/auth/admin/login` | Platform admin auth |
| GET | `/api/v1/auth/me` | JWT |
| GET | `/api/v1/dashboard/analytics/usage` | Analyst or org admin |
| GET, POST, DELETE | `/api/v1/dashboard/api-keys` | Org admin |
| GET, POST, DELETE | `/api/v1/dashboard/webhooks` | Org admin |
| GET, PATCH | `/api/v1/dashboard/settings/organization` | Org admin |

## Multi-Tenant Architecture

Each customer organization has its own users, predictions, API keys, webhooks, pincode records, and courier records. Queries that read tenant data take `organizationId` from the authenticated user or API key.

Roles:

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform console: organizations, users, system health, datasets, training |
| `ORGANIZATION_ADMIN` | Org dashboard, API keys, webhooks, settings, predictions, bulk jobs |
| `ANALYST` | Predictions, pincodes, couriers, usage, COD, and bulk jobs. Not keys, webhooks, or org settings |

Organization status can be `PENDING`, `ACTIVE`, `SUSPENDED`, or `DELETED`. Suspended tenants are blocked by tenant middleware. Users can be pending verification, active, locked, or deactivated. Failed logins increment a counter and can lock the account.

Customer routes live under `/app`. Platform admin routes live under `/admin`. Marketing pages are `/`, `/try`, `/features`, `/pricing`, and `/about`.

Organization settings cover name, billing email, timezone, currency, data-retention days, COD verification policy, and training-data consent.

## Background Jobs

`npm run dev` starts the API and the worker together. The worker process connects to MongoDB and Redis, then runs:

| Queue | Purpose |
|-------|---------|
| `email` | Verification and password-reset mail when SMTP is configured |
| `webhook` | Signed outbound webhook delivery |
| `messaging` | COD WhatsApp open, reply, and session expiry |
| `bulk-prediction` | Spreadsheet prediction jobs |
| `training-data-sync` | Scheduled and on-demand training-data sync |

On `SIGINT` and `SIGTERM`, the API stops accepting HTTP connections and then disconnects Redis and MongoDB. It exits if shutdown exceeds 10 seconds. The worker closes each BullMQ worker, then disconnects Redis and MongoDB.

## Security

Implemented controls:

- bcrypt password hashes
- JWT access tokens and rotating refresh cookies
- email verification and password reset tokens
- role checks on dashboard and admin routes
- API keys stored as hashes, with scopes and revoke
- Redis rate limits on auth and on API usage
- plan quotas for daily predictions and monthly calls
- Zod request validation
- Helmet security headers
- CORS limited to the configured frontend origin, with credentials
- `express-mongo-sanitize` on request bodies
- organization isolation on tenant data
- internal token required on AI predict and train routes, and on `GET /internal/v1/health/secure`

The repository does not include a security certification or a hosted secret manager. Secrets are environment variables.

## Testing

Backend tests are Jest unit tests:

- `backend/tests/unit/addressAnalysis.test.ts`
- `backend/tests/unit/apiUsage.service.test.ts`
- `backend/tests/unit/codVerification.service.test.ts`
- `backend/tests/unit/rateLimit.middleware.test.ts`

AI tests are pytest tests in `ai-service/tests/test_feature_pipeline.py`.

```powershell
cd backend
npm test

cd ..\ai-service
python -m pytest -q
```

`npm run test:coverage` in `backend/` collects Jest coverage. No coverage percentage is checked in. The frontend package has a lint and production build, and no automated test script. GitHub Actions runs the backend build and tests, the frontend build, and the AI pytest suite on push and pull request.

## Deployment

Local and production-shaped stacks are Docker Compose files. `docker-compose.yml` runs MongoDB 7, Redis 7.2, the API, the worker, the AI service, the frontend, and Nginx. `docker-compose.prod.yml` is an overlay that sets production environment variables, drops source-code volume mounts, and serves the built frontend on port 8080.

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

CI is `.github/workflows/ci.yml`. It does not deploy. `infrastructure/scripts/deploy-college-vm.sh` is a separate VM script. This repository does not record a public production hostname or a live deployment.

## Project Structure

```text
frontend/                 React, Vite, MUI
  src/modules/            marketing, auth, predictions, pincodes, API keys,
                          usage, settings, webhooks, COD, bulk jobs, developers, admin
backend/                  Express API and BullMQ workers
  src/routes/             auth, public, dashboard, admin, inbound webhooks
  src/jobs/workers/       email, webhook, messaging, bulk prediction, training sync
  tests/unit/
ai-service/               FastAPI inference and training
  app/ml/                 feature pipeline, XGBoost trainer, model registry
  tests/
infrastructure/           Dockerfiles, Nginx, Mongo init
docs/                     phase notes, OpenAPI, training-data and COD notes
.github/workflows/ci.yml
data/datasets/            training files used by the API and AI service
```

## Technology Stack

| Area | Technologies in this repository |
|------|----------------------------------|
| Frontend | React 18, Vite, TypeScript, MUI, TanStack Query, React Router, Zustand, Chart.js, Recharts |
| Backend | Node.js 20+, Express, TypeScript, Zod, Mongoose, JWT, Winston, Swagger UI |
| Database | MongoDB 7 |
| Cache / queue | Redis 7.2, ioredis, BullMQ |
| AI / ML | Python 3.11, FastAPI, Uvicorn, XGBoost, SHAP, scikit-learn, pandas, joblib |
| COD messaging | Twilio WhatsApp and OpenAI, when configured |
| Mail | Nodemailer over SMTP, when configured |
| Infrastructure | Docker Compose, Nginx, GitHub Actions |
| Testing | Jest, mongodb-memory-server, pytest |

## Development

Requirements: Node.js 20 or newer, Python 3.11, and MongoDB plus Redis. BullMQ requires Redis 5 or newer. The Compose file uses Redis 7.2.

```powershell
# MongoDB and Redis
docker compose up -d mongodb redis

# Backend API and workers
cd backend
Copy-Item .env.example .env
npm install
npm run dev

# AI service
cd ..\ai-service
Copy-Item .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd ..\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Seed demo organizations, users, and a test API key:

```powershell
cd backend
npm run seed
```

After seeding:

- Customer portal: `admin@demo-logistics.com` / `Demo@123456` at http://localhost:5173/customer/auth/login
- Platform admin: `superadmin@predixroute.com` / `Demo@123456` at http://localhost:5173/admin/auth/login
- API key: `prx_test_demo_seed_key_for_local_dev_only`

The frontend dev server is http://localhost:5173. The API is http://localhost:3000. The AI service is http://localhost:8000 and is internal.

Backend environment variables used by the app are listed in `backend/.env.example`:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV`, `PORT`, `LOG_LEVEL` | Process settings. Default port is 3000 |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | At least 32 characters each |
| `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` | Token lifetimes |
| `AI_SERVICE_URL`, `AI_SERVICE_INTERNAL_TOKEN` | Internal AI service. Token must match `INTERNAL_TOKEN` in the AI service |
| `FRONTEND_URL` | CORS origin. Default `http://localhost:5173` |
| `ADMIN_REGISTRATION_SECRET` | Optional gate for platform-admin registration |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Optional mail |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_WHATSAPP_TEMPLATE_SID`, `TWILIO_WEBHOOK_BASE_URL` | Optional WhatsApp |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional COD conversation model. Default model name is `gpt-4o-mini` |

For Compose, MongoDB is `mongodb://predixroute:predixroute_dev@localhost:27017/predixroute?authSource=admin` and Redis is `redis://localhost:6379`.

AI service variables in `ai-service/.env.example`: `ENVIRONMENT`, `INTERNAL_TOKEN`, `MODEL_VERSION`, `DATASET_ROOT`, `BOOTSTRAP_MODEL_ON_STARTUP`.

Frontend variable in `frontend/.env.example`: `VITE_API_BASE_URL=http://localhost:3000/api/v1`.

Example risk call:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/public/risk/evaluate" `
  -Headers @{ "X-API-Key" = "prx_test_demo_seed_key_for_local_dev_only"; "Content-Type" = "application/json" } `
  -Body '{"destinationPincode":"110001","weightGrams":500,"cod":true,"codAmount":1499,"orderValue":1499,"addressQualityScore":0.72,"availableCouriers":["delhivery","bluedart","dtdc"]}'
```

## Implementation Status

| Area | Status |
|------|--------|
| Core platform | Implemented |
| Multi-tenant SaaS | Implemented |
| RTO risk prediction | Implemented |
| Explainable predictions | Implemented |
| Pincode intelligence | Implemented |
| Courier intelligence | Implemented |
| Courier recommendation | Implemented |
| Bulk prediction | Implemented |
| Training and data workflows | Implemented |
| Webhooks | Implemented |
| COD verification | Implemented |
| Developer and API portal | Implemented |
| Admin platform | Implemented |
| Usage and quotas | Implemented |
| Security foundations | Implemented |
| CI pipeline | Implemented |
| Docker production configuration | Implemented |

## Future Improvements

These items are not in the repository today:

- an official client SDK
- model families other than the current XGBoost classifier
- analytics beyond the usage dashboard
- a hosted secret manager in the deploy path
- automated frontend tests

## License

Proprietary — PredixRoute © 2026
