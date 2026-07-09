# Phase 6 — API Design

## Base Conventions

| Convention | Value |
|-----------|-------|
| Base URL | `https://api.predixroute.com/api/v1` |
| Content-Type | `application/json` |
| Auth (Public) | `X-API-Key: prx_live_xxx` |
| Auth (Dashboard) | httpOnly cookie or `Authorization: Bearer {jwt}` |
| Request ID | Response header `X-Request-Id` |
| Pagination | `?page=1&limit=20` |
| Date format | ISO 8601 UTC |

## Standard Response Envelope

```typescript
// Success
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
  meta?: { pagination?: PaginationMeta };
}

// Error
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}
```

## Error Codes

| HTTP | Code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `API_KEY_REQUIRED` | Missing X-API-Key |
| 401 | `INVALID_API_KEY` | Key not found or revoked |
| 403 | `SCOPE_DENIED` | Key lacks required scope |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 429 | `QUOTA_EXCEEDED` | Monthly/daily quota exhausted |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI service down |

---

## Public APIs

### POST /api/v1/public/risk/evaluate

**Scope:** `risk:evaluate`  
**Rate Limit:** Plan-based (Starter: 60/min, Growth: 300/min)

**Request:**
```json
{
  "destinationPincode": "110001",
  "weightGrams": 500,
  "cod": true,
  "codAmount": 1499.00,
  "orderValue": 1499.00,
  "addressQualityScore": 0.72,
  "availableCouriers": ["delhivery", "bluedart", "dtdc"],
  "externalRef": "ORD-2026-001234"
}
```

**Validation Rules:**
| Field | Type | Rules |
|-------|------|-------|
| destinationPincode | string | Required, `/^\d{6}$/` |
| weightGrams | integer | Required, 1–50000 |
| cod | boolean | Required |
| codAmount | number | Required if cod=true, > 0 |
| orderValue | number | Required, > 0 |
| addressQualityScore | number | Required, 0.0–1.0 |
| availableCouriers | string[] | Required, 1–20 items, non-empty strings |
| externalRef | string | Optional, max 100 chars |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictionId": "prd_k7x9m2n4p1",
    "deliveryProbability": 0.847,
    "riskScore": 23.5,
    "riskLevel": "LOW",
    "recommendedCourier": "delhivery",
    "courierRankings": [
      {
        "courier": "delhivery",
        "score": 87.3,
        "successProbability": 0.91,
        "breakdown": {
          "successWeight": 36.4,
          "performanceWeight": 22.1,
          "rtoWeight": 13.8,
          "slaWeight": 8.5,
          "costWeight": 6.5
        }
      }
    ],
    "explanations": [
      {
        "feature": "cod_amount",
        "value": 1499,
        "impact": 0.12,
        "direction": "INCREASES_RISK",
        "description": "Moderate COD amount increases delivery risk"
      }
    ],
    "modelVersion": "1.2.0",
    "evaluatedAt": "2026-06-10T14:30:00.000Z"
  },
  "requestId": "req_abc123"
}
```

---

### POST /api/v1/public/recommendation

**Scope:** `recommendation`

**Request:**
```json
{
  "destinationPincode": "400001",
  "weightGrams": 1200,
  "cod": false,
  "orderValue": 3500,
  "addressQualityScore": 0.85,
  "availableCouriers": ["delhivery", "bluedart", "ecom_express"],
  "costConstraints": {
    "maxCostPerKg": 45
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendationId": "rec_m3n8k2j9",
    "rankings": [
      {
        "rank": 1,
        "courier": "bluedart",
        "compositeScore": 91.2,
        "successProbability": 0.94,
        "estimatedDeliveryDays": 2.1,
        "estimatedCost": 38.50,
        "rtoRate": 0.04
      }
    ],
    "evaluatedAt": "2026-06-10T14:30:00.000Z"
  },
  "requestId": "req_def456"
}
```

---

### POST /api/v1/public/batch/evaluate

**Scope:** `batch`  
**Max batch size:** Plan-based (Starter: 10, Growth: 50, Enterprise: 100)

**Request:**
```json
{
  "shipments": [
    {
      "ref": "ORD-001",
      "destinationPincode": "110001",
      "weightGrams": 500,
      "cod": true,
      "codAmount": 999,
      "orderValue": 999,
      "addressQualityScore": 0.8,
      "availableCouriers": ["delhivery", "dtdc"]
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "batchId": "bat_x7k2m9n1",
    "totalProcessed": 1,
    "successCount": 1,
    "errorCount": 0,
    "results": [
      {
        "ref": "ORD-001",
        "status": "SUCCESS",
        "prediction": { "predictionId": "prd_...", "riskScore": 18.2, "riskLevel": "LOW" }
      }
    ],
    "errors": []
  },
  "requestId": "req_ghi789"
}
```

**Partial failure response:** HTTP 207 Multi-Status with mixed results.

---

### GET /api/v1/public/pincode/:pincode

**Scope:** `pincode:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pincode": "110001",
    "city": "New Delhi",
    "state": "Delhi",
    "tier": "METRO",
    "riskScore": 15.2,
    "successRate": 0.94,
    "rtoRate": 0.06,
    "avgDeliveryDays": 2.3,
    "bestCourier": "delhivery",
    "worstCourier": "dtdc",
    "courierBreakdown": [
      { "courier": "delhivery", "successRate": 0.96, "rtoRate": 0.04, "avgDeliveryDays": 2.1 }
    ],
    "trend": [
      { "period": "2026-05", "successRate": 0.93, "riskScore": 16.1 }
    ]
  },
  "requestId": "req_jkl012"
}
```

---

### GET /api/v1/public/courier/:courier

**Scope:** `courier:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courierCode": "delhivery",
    "courierName": "Delhivery",
    "successRate": 0.92,
    "rtoRate": 0.08,
    "avgDeliveryDays": 2.8,
    "p90DeliveryDays": 5.2,
    "codSuccessRate": 0.88,
    "avgCostPerKg": 42.5,
    "trend": [
      { "period": "2026-05", "successRate": 0.91, "rtoRate": 0.09 }
    ],
    "topPincodes": [
      { "pincode": "110001", "successRate": 0.96 }
    ],
    "worstPincodes": [
      { "pincode": "845401", "successRate": 0.62 }
    ]
  },
  "requestId": "req_mno345"
}
```

---

### GET /api/v1/public/health

**Auth:** None required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-06-10T14:30:00.000Z",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "aiService": "healthy"
    }
  }
}
```

---

## Rate Limiting Strategy

### Algorithm: Sliding Window Counter (Redis)

```
Key: ratelimit:{orgId}:{window}:{minute}
INCR → if count > limit → 429
EXPIRE 60 seconds
```

### Response Headers

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1718026260
Retry-After: 42          (only on 429)
```

### Tier Limits

| Plan | Req/min | Req/month | Batch max | Predictions/day |
|------|---------|-----------|-----------|-----------------|
| Starter | 60 | 10,000 | 10 | 500 |
| Growth | 300 | 100,000 | 50 | 5,000 |
| Enterprise | 1,000 | Unlimited | 100 | Unlimited |

### Quota Enforcement Flow

```
1. Check minute rate limit (Redis INCR)
2. Check daily prediction count (ApiUsage daily doc)
3. Check monthly API count (ApiUsage monthly doc)
4. If any exceeded → 429 with specific code (RATE_LIMIT vs QUOTA_EXCEEDED)
5. On api.limit.reached → emit webhook + email
```

---

## Dashboard API Highlights

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard/analytics/executive` | ANALYST+ | Executive KPIs |
| GET | `/dashboard/predictions` | ANALYST+ | List predictions |
| POST | `/dashboard/predictions/evaluate` | ANALYST+ | Dashboard risk eval |
| GET | `/dashboard/datasets` | ANALYST+ | List datasets |
| POST | `/dashboard/datasets/upload` | ORG_ADMIN | Upload CSV |
| POST | `/dashboard/models/train` | ORG_ADMIN | Start training |
| POST | `/dashboard/models/:id/activate` | ORG_ADMIN | Activate model |
| GET | `/dashboard/api-keys` | ORG_ADMIN | List keys |
| POST | `/dashboard/api-keys` | ORG_ADMIN | Create key |
| GET | `/dashboard/webhooks` | ORG_ADMIN | List webhooks |

Full OpenAPI spec: `docs/openapi/public-api.yaml` and `docs/openapi/dashboard-api.yaml`.
