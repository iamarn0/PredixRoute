# PredixRoute — Production Readiness

Last updated: 2026-06-13

## Implemented (Production Foundations)

| Area | Status | Notes |
|------|--------|-------|
| Multi-tenant auth (JWT + RBAC) | Done | Separate customer/admin portals, lockout, refresh rotation |
| Auth hardening | Done | Rate limits, token revocation on logout |
| Email verify / password reset | Done | BullMQ email queue; SMTP when configured, console log in dev |
| API key auth + quotas | Done | Per-minute, daily predictions, monthly API quota |
| Batch evaluation | Done | Public + dashboard batch routes |
| Tenant-aware ML | Done | XGBoost + SHAP when model artifact present |
| Deep health checks | Done | MongoDB, Redis, AI service on `/api/v1/health` |
| Graceful shutdown | Done | SIGTERM/SIGINT handlers |
| Admin console | Done | Platform stats, org list, suspend/activate tenants |
| Usage dashboard | Done | `/app/usage` with plan quota visibility |
| Organization settings | Done | `/app/settings` |
| Webhooks | Done | CRUD + signed HMAC delivery via BullMQ worker |
| COD AI Verification | Done | Twilio WhatsApp + OpenAI agent; `/app/cod-verifications` |
| Separate predict vs confirm APIs | Done | `/public/risk/evaluate` (never messages) vs `/public/risk/evaluate-and-verify` |
| Marketing demo | Done | `/try` + `POST /public/demo/risk/evaluate` (IP rate limited) |
| Bulk predict (CSV) | Done | `/app/bulk-predictions` async jobs |
| Training data consent + contributions | Done | Settings opt-in, CSV backfill, outcome API, admin review queue |
| Developer portal | Done | `/app/developers` with API 1 vs API 2 docs |
| Background workers | Done | Started with `npm run dev` locally; production uses `npm run start:worker` |
| OpenAPI docs | Done | `/api/v1/docs` (non-production only) |
| CI pipeline | Done | `.github/workflows/ci.yml` |
| Docker production profile | Done | `docker-compose.prod.yml` |
| Unit tests | Done | Backend Jest + AI feature pipeline tests (CI/Linux) |

## Demo Credentials (after `npm run seed`)

| Portal | Email | Password | URL |
|--------|-------|----------|-----|
| Customer | `admin@demo-logistics.com` | `Demo@123456` | `/customer/auth/login` |
| Platform Admin | `superadmin@predixroute.com` | `Demo@123456` | `/admin/auth/login` |

## Local Development

```powershell
# Terminal 1 — Backend API + background workers (single command)
cd backend
npm run dev

# Terminal 2 — AI service
cd ai-service
python scripts/train_risk_model.py   # first run only
uvicorn app.main:app --reload --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev

# Seed data
cd backend
npm run seed
```

## Production Deployment

```powershell
# Build and run with production overlay
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Configure these environment variables in production:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — transactional email
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — rotate from dev defaults
- `ADMIN_REGISTRATION_SECRET` — required to gate admin self-registration
- `MONGODB_URI`, `REDIS_URL` — managed cloud instances
- `FRONTEND_URL` — public app URL for email links
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` — COD WhatsApp verification
- `TWILIO_WHATSAPP_TEMPLATE_SID` — approved English opening template (optional in dev)
- `TWILIO_WEBHOOK_BASE_URL` — public API base URL for Twilio signature validation
- `OPENAI_API_KEY`, `OPENAI_MODEL` — AI conversation agent for COD replies

See [COD_VERIFICATION.md](./COD_VERIFICATION.md) for integration details.

## ML Model Training

Models train **only from uploaded shipment CSVs** — no synthetic data. **Upload and training are admin-only**, entirely separate from tenant organization management.

1. Admin console → **Model Training** (`/admin/training`) → upload MIS / shipment CSV → **Train model**
2. Download CSV template from that page (min **100 rows** with **final** outcomes)
3. **Organizations** is for tenant admin only — no ML upload there

Training data is **platform-wide** (courier + pincode + shipment outcomes). One shared model powers predictions for all customers.

Customers use predictions only; they cannot upload datasets or trigger training.

Per-org artifact path (internal): `ai-service/models/orgs/{platformOrgId}/risk_classifier.joblib`

### Status column (NDR / RTO / reattempt)

Real logistics often looks like: **failed attempt → NDR → seller chooses RTO or reattempt**.

| Stage | Use in training CSV? | `status` value |
|-------|----------------------|----------------|
| Delivered (first or after reattempt) | Yes | `delivered`, `reattempt_delivered`, etc. |
| Seller initiated RTO / returned | Yes | `rto`, `return_to_origin`, etc. |
| NDR / in-transit / awaiting seller | **No — skipped** | `ndr`, `reattempt_scheduled`, `in_transit`, … |

Export historical data with the **final closed outcome** per shipment, not the NDR row. PredixRoute predicts **upfront risk** before dispatch; it does not model live NDR workflows.

### Uploading a logistics MIS export

You can upload a **raw MIS / shipment report CSV** — PredixRoute auto-maps common column names. Extra columns are ignored.

Typical wide MIS layout (matches standard shipment dumps):

| Your MIS column | Training use |
|-----------------|--------------|
| Order ID, AWB Number | Ignored |
| Courier Name | **Courier** |
| Shipment Type | Ignored |
| **Status** | **Outcome label** (use closed rows: Delivered / RTO) |
| Sub Status | Ignored (do not use instead of Status) |
| Customer Name, Contact, City, State | Ignored |
| **Pincode** (in address block) | **Destination** |
| Product Name, Quantity | Ignored |
| Order / Pickup / Delivery / RTO dates | Ignored |
| Current Location, Last Remark | Ignored |
| NDR Status, NDR Reason, Attempt Count | Ignored (NDR rows with open Status are skipped) |
| **Payment Mode** | **COD vs Prepaid** |
| **Order Value** | **Order value** |
| **Weight** / Charged Weight | **Weight** (kg converted automatically) |
| Length, Breadth, Height, Warehouse | Ignored |

Prefer filtering exports to **Delivered + RTO** shipments before upload, or rely on auto-skip for in-flight statuses.

Customers use predictions only; they cannot upload datasets or trigger training.

Platform model artifact: `ai-service/models/orgs/{platformOrgId}/risk_classifier.joblib`

Set `DATASET_ROOT` to a path shared by backend and AI service (default: `../data/datasets` from each service root).

## Next Sprints

- Analytics dashboards & PDF reports
- TypeScript public SDK
- Secrets manager integration (AWS/GCP)
- Production TLS certificates in nginx
