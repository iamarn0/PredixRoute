# Phase 23 — Performance Strategy

## Redis Caching

### Cache Layers

| Layer | Key Pattern | TTL | Data |
|-------|------------|-----|------|
| Pincode perf | `cache:pincode:{orgId}:{pincode}` | 300s | PincodePerformance JSON |
| Courier perf | `cache:courier:{orgId}:{code}` | 300s | CourierPerformance JSON |
| Active model | `cache:model:active:{orgId}:{type}` | 600s | Model metadata |
| Dashboard | `cache:dash:{type}:{orgId}:{hash}` | 60s | Aggregated dashboard data |
| API plan | `cache:plan:{orgId}` | 3600s | Subscription + plan limits |
| Public API health | `cache:health` | 30s | Health check response |

### Cache-Aside Pattern

```typescript
async function getCachedPincode(orgId: string, pincode: string): Promise<PincodePerformance> {
  const cacheKey = `cache:pincode:${orgId}:${pincode}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const data = await pincodePerformanceRepo.findByPincode(pincode, orgId);
  if (data) {
    await redis.setex(cacheKey, 300, JSON.stringify(data));
  }
  return data;
}
```

### Cache Invalidation

- On shipment status update → invalidate pincode + courier caches
- On model activation → invalidate model cache
- On plan change → invalidate plan cache
- Nightly aggregation → bulk invalidation via pattern `cache:pincode:{orgId}:*`

## MongoDB Aggregation Pipelines

### Dashboard Executive KPIs (single pipeline)

```javascript
db.predictions.aggregate([
  { $match: { organizationId: ObjectId(orgId), createdAt: { $gte: thirtyDaysAgo } } },
  { $facet: {
      totalCount: [{ $count: 'count' }],
      avgRisk: [{ $group: { _id: null, avg: { $avg: '$output.riskScore' } } }],
      riskDistribution: [
        { $group: { _id: '$output.riskLevel', count: { $sum: 1 } } },
      ],
      dailyTrend: [
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgRisk: { $avg: '$output.riskScore' },
        }},
        { $sort: { _id: 1 } },
      ],
  }},
])
```

**Performance:** `$facet` runs sub-pipelines in parallel on same input — single collection scan.

## Database Indexing

See Phase 3 for complete index strategy. Key performance indexes:

```javascript
// Most critical — every list query
{ organizationId: 1, createdAt: -1 }

// Prediction analytics
{ organizationId: 1, 'output.riskLevel': 1, createdAt: -1 }

// API usage metering (upsert)
{ organizationId: 1, period: 1, periodType: 1, endpoint: 1 }  // unique

// Pincode public API
{ pincode: 1, organizationId: 1, period: 1 }
```

### Index Monitoring

```javascript
// Run monthly
db.predictions.aggregate([{ $indexStats: {} }])
// Alert if any index ops === 0 for 30 days → candidate for removal
```

## Pagination

```typescript
interface PaginationParams {
  page: number;     // default 1, min 1
  limit: number;    // default 20, max 100
  sort?: string;    // field name
  order?: 'asc' | 'desc';
}

// Cursor-based pagination for high-volume endpoints (predictions, audit logs)
interface CursorPagination {
  cursor?: string;  // base64 encoded last _id + createdAt
  limit: number;
}
```

**Rule:** Always use `.lean()` for read queries (skip Mongoose hydration overhead).

## Connection Pooling

```typescript
// MongoDB
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
});

// Redis
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  connectTimeout: 10000,
});

// AI Service HTTP
axios.create({
  timeout: 30000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
});
```

## Background Processing

| Operation | Strategy | Target Latency |
|-----------|----------|---------------|
| Risk prediction | Sync (AI service) | < 200ms p95 |
| Batch evaluate | Sync parallel (max 100) | < 5s p95 |
| Dataset processing | Async (BullMQ) | Minutes |
| Model training | Async (BullMQ) | 5–60 min |
| Report generation | Async (BullMQ) | 10–120s |
| Webhook delivery | Async (BullMQ) | < 5s initial |
| Aggregation | Async (cron) | Nightly |

## Performance Targets

| Metric | Target |
|--------|--------|
| Public API p50 latency | < 100ms |
| Public API p95 latency | < 200ms |
| Public API p99 latency | < 500ms |
| Dashboard API p95 | < 300ms |
| MongoDB query p95 | < 50ms |
| Redis operation p95 | < 5ms |
| Throughput (single backend instance) | 1000 req/sec |
| Concurrent connections | 5000 |

## Load Testing Strategy

```bash
# k6 load test script
k6 run --vus 100 --duration 5m scripts/load-test-risk-evaluate.js
```

Target: 100 VUs × 5 min with < 1% error rate and p95 < 200ms.
