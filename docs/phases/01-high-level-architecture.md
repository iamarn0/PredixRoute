# Phase 1 — Complete High-Level Architecture

## 1.1 System Context Diagram

```mermaid
C4Context
  title PredixRoute System Context

  Person(tenant_admin, "Organization Admin", "Manages org, API keys, datasets, models")
  Person(analyst, "Analyst", "Views dashboards, runs predictions, exports reports")
  Person(integrator, "API Integrator", "Integrates via REST API / SDK / Webhooks")
  Person(super_admin, "Super Admin", "Platform operator — tenants, plans, global models")

  System(predixroute, "PredixRoute Platform", "Multi-tenant SaaS + Public API for logistics intelligence")

  System_Ext(oms, "OMS / ERP / WMS", "Order management systems")
  System_Ext(ecommerce, "E-commerce Platforms", "Shopify, WooCommerce, custom")
  System_Ext(courier_apis, "Courier Aggregators", "Shiprocket, Delhivery, BlueDart APIs")
  System_Ext(email, "Email Provider", "SES / SendGrid")
  System_Ext(s3, "AWS S3", "Dataset & report storage")
  System_Ext(cloudwatch, "AWS CloudWatch", "Logs, metrics, alarms")

  Rel(tenant_admin, predixroute, "HTTPS — Dashboard")
  Rel(analyst, predixroute, "HTTPS — Dashboard")
  Rel(integrator, predixroute, "HTTPS — Public API")
  Rel(super_admin, predixroute, "HTTPS — Admin Console")
  Rel(oms, predixroute, "API — Risk & Recommendation")
  Rel(ecommerce, predixroute, "API — Batch Evaluate")
  Rel(predixroute, email, "Transactional email")
  Rel(predixroute, s3, "Upload/download datasets & reports")
  Rel(predixroute, cloudwatch, "Observability")
```

## 1.2 Service Architecture

```mermaid
flowchart TB
  subgraph ClientLayer["Client Layer"]
    WEB["React Dashboard<br/>(Vite + MUI)"]
    SDK_NODE["Node.js SDK"]
    SDK_PY["Python SDK"]
    EXT_API["External HTTP Clients"]
  end

  subgraph EdgeLayer["Edge Layer"]
    NGINX["Nginx<br/>TLS Termination, Rate Limit, WAF rules"]
  end

  subgraph AppLayer["Application Layer — Node.js Backend"]
    GW["API Gateway Router"]
    AUTH["Auth Service"]
    TENANT["Tenant Context Middleware"]
    PUB["Public API Module"]
    DASH["Dashboard API Module"]
    WH["Webhook Dispatcher"]
    JOB["BullMQ Job Enqueuer"]
  end

  subgraph DataLayer["Data Layer"]
    MONGO[("MongoDB Atlas<br/>Primary Store")]
    REDIS[("Redis<br/>Cache + Queues + Sessions")]
    S3[("AWS S3<br/>Datasets + Reports")]
  end

  subgraph AILayer["AI Layer — Internal Only"]
    FAST["FastAPI AI Service"]
    FEAT["Feature Pipeline"]
    INF["Inference Engine"]
    TRAIN["Training Pipeline"]
    SHAP["SHAP Explainability"]
    REG["Model Registry (local + Mongo metadata)"]
  end

  WEB --> NGINX
  SDK_NODE --> NGINX
  SDK_PY --> NGINX
  EXT_API --> NGINX
  NGINX --> GW
  GW --> AUTH
  GW --> TENANT
  GW --> PUB
  GW --> DASH
  PUB --> JOB
  DASH --> JOB
  AUTH --> MONGO
  AUTH --> REDIS
  PUB --> MONGO
  PUB --> REDIS
  PUB --> FAST
  DASH --> MONGO
  DASH --> S3
  JOB --> REDIS
  WH --> REDIS
  FAST --> FEAT
  FEAT --> INF
  INF --> SHAP
  TRAIN --> REG
  INF --> REG
  FAST --> REDIS
  TRAIN --> S3
```

### Service Responsibilities

| Service | Responsibility | Scaling Unit |
|---------|---------------|--------------|
| **Nginx** | TLS, reverse proxy, static assets, request size limits | Horizontal (ALB + EC2) |
| **Backend (Express)** | Auth, RBAC, tenant isolation, API orchestration, webhooks, job enqueue | Horizontal (stateless) |
| **AI Service (FastAPI)** | Feature engineering, inference, training, SHAP | Horizontal (GPU optional for training) |
| **MongoDB Atlas** | Multi-tenant document store, analytics aggregations | Sharded cluster (orgId shard key candidate) |
| **Redis** | Session store, rate limit counters, BullMQ, hot cache | Cluster mode |
| **S3** | Immutable dataset versions, generated reports | Bucket per env |

### Architecture Decision Records

**ADR-001: Monolith-first Backend with Extractable Modules**
- *Decision:* Single Express monolith with bounded modules (`auth`, `public-api`, `dashboard`, `webhooks`, `jobs`).
- *Rationale:* Faster time-to-market; clear module boundaries enable future extraction to microservices.
- *Trade-off:* Shared deployment blast radius vs. operational simplicity.

**ADR-002: Internal AI Service (No Direct Client Access)**
- *Decision:* FastAPI service on private network; only backend holds service credentials.
- *Rationale:* Security boundary, centralized auth/billing/rate-limiting, consistent audit trail.
- *Trade-off:* Extra network hop (~5–15ms) vs. security and governance.

**ADR-003: MongoDB over PostgreSQL**
- *Decision:* MongoDB for flexible shipment/prediction schemas and aggregation pipelines.
- *Rationale:* Document model fits nested courier lists, SHAP feature vectors, dataset metadata.
- *Trade-off:* Complex joins replaced by denormalization + aggregation pipelines.

## 1.3 Request Flow

### Public API — Risk Evaluation

```mermaid
sequenceDiagram
  participant C as External Client
  participant N as Nginx
  participant B as Backend API
  participant R as Redis
  participant M as MongoDB
  participant A as AI Service

  C->>N: POST /api/v1/public/risk/evaluate<br/>X-API-Key: prx_live_xxx
  N->>B: Forward (TLS terminated)
  B->>B: Validate API Key + Rate Limit
  B->>M: Resolve ApiKey → organizationId, plan limits
  B->>R: INCR rate:org:{orgId}:minute
  alt Rate limit exceeded
    B-->>C: 429 Too Many Requests
  end
  B->>B: Validate request body (Zod)
  B->>R: GET cache:pincode:{pincode}:stats
  alt Cache miss
    B->>M: Aggregate PincodePerformance
    B->>R: SET cache (TTL 300s)
  end
  B->>A: POST /internal/v1/predict/risk<br/>X-Internal-Token
  A->>A: Feature pipeline + active model inference
  A->>A: SHAP values (top 5 contributors)
  A-->>B: PredictionResult + explanations
  B->>M: Insert Prediction document
  B->>M: Increment ApiUsage counter
  B->>B: Emit prediction.created event
  B-->>C: 200 RiskEvaluationResponse
```

### Dashboard — Authenticated Request

```mermaid
sequenceDiagram
  participant U as User Browser
  participant B as Backend
  participant R as Redis
  participant M as MongoDB

  U->>B: GET /api/v1/dashboard/analytics/executive<br/>Cookie: accessToken (httpOnly)
  B->>B: JWT verify + extract userId, organizationId, role
  B->>B: RBAC check (ANALYST+)
  B->>R: GET cache:dashboard:exec:{orgId}:{date}
  alt Cache hit
    B-->>U: Cached dashboard payload
  else Cache miss
    B->>M: Aggregation pipeline (shipments, predictions, 30d window)
    B->>R: SET cache TTL 60s
    B-->>U: Dashboard payload
  end
```

## 1.4 Event Flow

```mermaid
flowchart LR
  subgraph Producers
    P1["Prediction Service"]
    P2["Dataset Service"]
    P3["Model Training Job"]
    P4["Report Service"]
    P5["Usage Meter"]
  end

  subgraph EventBus["In-Process Event Bus + BullMQ"]
    EB["Domain Events"]
    Q1["webhook-delivery"]
    Q2["email"]
    Q3["audit-log"]
  end

  subgraph Consumers
    WH["Webhook Worker"]
    EM["Email Worker"]
    AU["Audit Worker"]
    AN["Analytics Aggregator"]
  end

  P1 -->|prediction.created| EB
  P2 -->|dataset.processed| EB
  P3 -->|model.trained| EB
  P4 -->|report.generated| EB
  P5 -->|api.limit.reached| EB

  EB --> Q1
  EB --> Q2
  EB --> Q3
  Q1 --> WH
  Q2 --> EM
  Q3 --> AU
  P1 --> AN
```

### Event Catalog

| Event | Payload | Consumers |
|-------|---------|-----------|
| `prediction.created` | `{ predictionId, organizationId, riskLevel, shipmentRef }` | Webhooks, Analytics |
| `model.trained` | `{ modelId, version, metrics, organizationId }` | Webhooks, Notification |
| `dataset.processed` | `{ datasetId, rowCount, qualityScore }` | Webhooks, Training scheduler |
| `report.generated` | `{ reportId, format, s3Key }` | Webhooks, Email |
| `api.limit.reached` | `{ organizationId, planId, limitType }` | Webhooks, Email, Billing |

## 1.5 Security Boundaries

```mermaid
flowchart TB
  subgraph PublicInternet["Public Internet — Untrusted"]
    CLIENTS["Clients"]
  end

  subgraph DMZ["DMZ — Edge"]
    NGINX["Nginx + WAF"]
  end

  subgraph AppSubnet["Application Subnet — Semi-Trusted"]
    BACKEND["Node.js Backend"]
    FRONTEND["Static Frontend"]
  end

  subgraph PrivateSubnet["Private Subnet — Trusted"]
    AI["FastAPI AI Service"]
    WORKERS["BullMQ Workers"]
  end

  subgraph DataSubnet["Data Subnet — Highly Restricted"]
    MONGO["MongoDB Atlas VPC Peering"]
    REDIS["ElastiCache Redis"]
  end

  CLIENTS -->|HTTPS 443| NGINX
  NGINX -->|HTTP internal| BACKEND
  NGINX -->|HTTP internal| FRONTEND
  BACKEND -->|mTLS optional| AI
  BACKEND --> MONGO
  BACKEND --> REDIS
  AI --> REDIS
  WORKERS --> MONGO
  WORKERS --> REDIS
  BACKEND -.->|NO direct path| CLIENTS
  AI -.->|BLOCKED| CLIENTS
```

### Security Zones

| Zone | Trust Level | Controls |
|------|-------------|----------|
| **Public API** | Untrusted | API key auth, rate limits, input validation, no PII in logs |
| **Dashboard API** | Authenticated users | JWT + RBAC + CSRF + httpOnly cookies |
| **Internal AI** | Service-to-service | Internal JWT / mTLS, network ACL, no public DNS |
| **Data** | Highest | Encryption at rest (AES-256), TLS in transit, IP allowlist |

## 1.6 Multi-Tenant Strategy

### Tenant Isolation Model: **Shared Database, Shared Schema, Discriminator Column**

Every collection document includes `organizationId: ObjectId` (required, indexed).

```typescript
// Enforced at repository layer — NEVER optional
interface TenantDocument {
  organizationId: Types.ObjectId;
}
```

### Isolation Layers

1. **Repository Layer:** All queries inject `{ organizationId }` via `TenantScopedRepository` base class.
2. **Middleware Layer:** `tenantContextMiddleware` extracts `organizationId` from JWT or API key and attaches to `req.tenant`.
3. **Super Admin Bypass:** `SUPER_ADMIN` role uses explicit `?organizationId=` for cross-tenant ops; all bypasses audit-logged.
4. **API Keys:** Scoped to single organization; key hash stored, prefix `prx_live_` / `prx_test_`.

### Tenant Lifecycle

```
REGISTER → EMAIL_VERIFY → CREATE_ORG → SELECT_PLAN → ACTIVE
                                              ↓
                                    SUSPENDED (billing)
                                              ↓
                                    DELETED (soft, 30d retention)
```

### Resource Quotas (per plan)

| Resource | Starter | Growth | Enterprise |
|----------|---------|--------|------------|
| API calls/month | 10,000 | 100,000 | Unlimited |
| Predictions/day | 500 | 5,000 | Custom |
| Datasets | 3 | 20 | Unlimited |
| Webhooks | 2 | 10 | Unlimited |
| Users | 3 | 15 | Unlimited |

## 1.7 Deployment Architecture

```mermaid
flowchart TB
  subgraph AWS["AWS ap-south-1 (Primary)"]
    R53["Route 53<br/>api.predixroute.com<br/>app.predixroute.com"]
    ALB["Application Load Balancer"]
    
    subgraph EC2ASG["EC2 Auto Scaling Group"]
      EC2A["EC2 t3.large<br/>Docker Compose Stack"]
      EC2B["EC2 t3.large<br/>Docker Compose Stack"]
    end

    subgraph Services["Per EC2 Instance"]
      NGX["Nginx"]
      BE["Backend x2 processes"]
      AI["AI Service x2 workers"]
      WK["BullMQ Workers"]
    end

    S3B["S3 Bucket<br/>predixroute-prod-assets"]
    CW["CloudWatch<br/>Logs + Metrics + Alarms"]
    SM["Secrets Manager"]
  end

  subgraph Atlas["MongoDB Atlas"]
    MONGO["M10+ Replica Set<br/>ap-south-1"]
  end

  subgraph ElastiCache["ElastiCache Redis"]
    REDIS["r6g.large Cluster"]
  end

  R53 --> ALB
  ALB --> EC2ASG
  EC2A --> Services
  EC2B --> Services
  BE --> MONGO
  BE --> REDIS
  BE --> S3B
  AI --> REDIS
  WK --> REDIS
  EC2ASG --> CW
  BE --> SM
```

### Environment Matrix

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| **dev** | Local Docker Compose | MongoDB + Redis containers |
| **staging** | Pre-prod validation | Single EC2, Atlas M10, shared Redis |
| **production** | Live traffic | ASG 2–10 EC2, Atlas M30+, Redis Cluster |

### High Availability

- **Backend:** Stateless; 2+ instances behind ALB; health check `/api/v1/health`
- **AI Service:** 2+ instances; circuit breaker in backend (opossum)
- **MongoDB:** 3-node replica set; automatic failover
- **Redis:** Cluster mode with replica; BullMQ job persistence via AOF
- **RTO:** 15 minutes | **RPO:** 1 hour (Atlas continuous backup)

## 1.8 AI Architecture

```mermaid
flowchart TB
  subgraph Input["Shipment Input"]
    I1["Pincode"]
    I2["Weight / COD / Order Value"]
    I3["Address Quality Score"]
    I4["Available Couriers"]
    I5["Historical Features"]
  end

  subgraph FeatureEngine["Feature Engineering Pipeline"]
    F1["Pincode Risk Encoder"]
    F2["Courier Performance Lookup"]
    F3["COD Risk Transformer"]
    F4["Weight Bucket Encoder"]
    F5["Address NLP Score"]
    F6["Temporal Features"]
  end

  subgraph Models["Model Ensemble"]
    LR["Logistic Regression<br/>(baseline, interpretable)"]
    RF["Random Forest<br/>(non-linear interactions)"]
    XGB["XGBoost<br/>(primary production model)"]
  end

  subgraph Selection["Model Selection"]
    MS["Cross-validation F1/AUC<br/>Select champion model"]
  end

  subgraph Output["Outputs"]
    O1["Delivery Probability"]
    O2["Risk Score 0-100"]
    O3["Risk Level: LOW/MEDIUM/HIGH/CRITICAL"]
    O4["SHAP Top-5 Explanations"]
  end

  subgraph Recommend["Recommendation Engine"]
    R1["Success Probability 40%"]
    R2["Courier Performance 25%"]
    R3["RTO Performance 15%"]
    R4["Delivery SLA 10%"]
    R5["Cost Efficiency 10%"]
  end

  Input --> FeatureEngine
  FeatureEngine --> Models
  Models --> Selection
  Selection --> Output
  Output --> Recommend
  Output --> SHAP["SHAP Explainer"]
  SHAP --> O4
```

### AI Service Internal Endpoints (NOT public)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/internal/v1/predict/risk` | POST | Single shipment risk prediction |
| `/internal/v1/predict/batch` | POST | Batch predictions (max 100) |
| `/internal/v1/recommend/courier` | POST | Courier ranking |
| `/internal/v1/explain/shap` | POST | SHAP explanation generation |
| `/internal/v1/train/start` | POST | Trigger training pipeline |
| `/internal/v1/models/activate` | POST | Activate model version |
| `/internal/v1/health` | GET | AI service health |

### Model Lifecycle

```
DATASET_UPLOAD → VALIDATE → FEATURE_ENGINEER → TRAIN(LR,RF,XGB)
      → EVALUATE → SELECT_BEST → REGISTER → STAGING → ACTIVATE → MONITOR
                                                      ↓
                                                  ROLLBACK (if drift detected)
```

### ML Infrastructure Decisions

**ADR-004: Champion/Challenger Model Strategy**
- Production always serves the `ACTIVE` model from registry.
- New models enter `STAGING`; A/B shadow predictions optional before activation.

**ADR-005: Feature Store (Phase 1: Embedded)**
- Pincode/Courier performance cached in Redis (TTL 5 min) and pre-computed in MongoDB aggregations.
- Future: extract to dedicated feature store (Feast/Tecton).

**ADR-006: Training on Backend-Triggered Jobs**
- Training initiated via dashboard → Backend enqueues BullMQ job → Job calls AI service `/train/start`.
- Training artifacts stored in S3; metadata in MongoDB `Models` collection.
