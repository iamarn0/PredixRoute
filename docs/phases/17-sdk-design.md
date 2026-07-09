# Phase 17 — SDK Design

## Node.js SDK

### Architecture

```
PredixRouteClient
  ├── risk: RiskResource
  ├── recommendation: RecommendationResource
  ├── batch: BatchResource
  ├── pincode: PincodeResource
  └── courier: CourierResource
```

### Installation

```bash
npm install @predixroute/sdk
```

### Client Implementation

```typescript
// sdk/nodejs/src/client.ts
export interface PredixRouteConfig {
  apiKey: string;
  baseUrl?: string;           // default: https://api.predixroute.com/api/v1
  timeout?: number;           // default: 30000
  maxRetries?: number;        // default: 3
  environment?: 'live' | 'test';
}

export class PredixRouteClient {
  private http: AxiosInstance;
  public risk: RiskResource;
  public recommendation: RecommendationResource;
  public batch: BatchResource;
  public pincode: PincodeResource;
  public courier: CourierResource;

  constructor(config: PredixRouteConfig) {
    if (!config.apiKey) throw new PredixRouteError('API key is required');

    this.http = axios.create({
      baseURL: config.baseUrl ?? 'https://api.predixroute.com/api/v1',
      timeout: config.timeout ?? 30000,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'PredixRoute-Node-SDK/1.0.0',
      },
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err) => this.handleError(err),
    );

    this.risk = new RiskResource(this.http);
    this.recommendation = new RecommendationResource(this.http);
    this.batch = new BatchResource(this.http);
    this.pincode = new PincodeResource(this.http);
    this.courier = new CourierResource(this.http);
  }
}
```

### Usage Examples

```typescript
import { PredixRouteClient } from '@predixroute/sdk';

const client = new PredixRouteClient({
  apiKey: process.env.PREDIXROUTE_API_KEY!,
});

// Risk Evaluation
const prediction = await client.risk.evaluate({
  destinationPincode: '110001',
  weightGrams: 500,
  cod: true,
  codAmount: 1499,
  orderValue: 1499,
  addressQualityScore: 0.72,
  availableCouriers: ['delhivery', 'bluedart', 'dtdc'],
  externalRef: 'ORD-2026-001234',
});

console.log(`Risk: ${prediction.riskLevel} (${prediction.riskScore})`);
console.log(`Recommended: ${prediction.recommendedCourier}`);

// Courier Recommendation
const rec = await client.recommendation.get({
  destinationPincode: '400001',
  weightGrams: 1200,
  cod: false,
  orderValue: 3500,
  addressQualityScore: 0.85,
  availableCouriers: ['delhivery', 'bluedart'],
});

// Batch Evaluation
const batch = await client.batch.evaluate({
  shipments: [
    { ref: 'ORD-001', destinationPincode: '110001', /* ... */ },
    { ref: 'ORD-002', destinationPincode: '560001', /* ... */ },
  ],
});

// Pincode Intelligence
const pincodeInfo = await client.pincode.get('110001');

// Courier Intelligence
const courierInfo = await client.courier.get('delhivery');
```

### Error Handling

```typescript
try {
  await client.risk.evaluate(input);
} catch (err) {
  if (err instanceof PredixRouteRateLimitError) {
    console.log(`Retry after ${err.retryAfter} seconds`);
  } else if (err instanceof PredixRouteValidationError) {
    console.log('Invalid input:', err.details);
  } else if (err instanceof PredixRouteAuthenticationError) {
    console.log('Check your API key');
  }
}
```

---

## Python SDK

### Installation

```bash
pip install predixroute
```

### Client Implementation

```python
# sdk/python/predixroute/client.py
class PredixRouteClient:
    BASE_URL = "https://api.predixroute.com/api/v1"

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        if not api_key:
            raise PredixRouteError("API key is required")

        self._session = requests.Session()
        self._session.headers.update({
            "X-API-Key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "PredixRoute-Python-SDK/1.0.0",
        })
        self.base_url = base_url or self.BASE_URL
        self.timeout = timeout

        self.risk = RiskResource(self)
        self.recommendation = RecommendationResource(self)
        self.batch = BatchResource(self)
        self.pincode = PincodeResource(self)
        self.courier = CourierResource(self)
```

### Usage Examples

```python
from predixroute import PredixRouteClient
from predixroute.exceptions import PredixRouteRateLimitError

client = PredixRouteClient(api_key="prx_live_xxxxxxxx")

# Risk Evaluation
prediction = client.risk.evaluate(
    destination_pincode="110001",
    weight_grams=500,
    cod=True,
    cod_amount=1499,
    order_value=1499,
    address_quality_score=0.72,
    available_couriers=["delhivery", "bluedart", "dtdc"],
    external_ref="ORD-2026-001234",
)

print(f"Risk: {prediction.risk_level} ({prediction.risk_score})")
print(f"Recommended: {prediction.recommended_courier}")

# Pincode Intelligence
pincode = client.pincode.get("400001")
print(f"Success rate: {pincode.success_rate:.0%}")

# Batch
results = client.batch.evaluate(shipments=[...])
for result in results.results:
    print(f"{result.ref}: {result.prediction.risk_level}")
```

## Authentication Strategy

| SDK | Auth Method | Header |
|-----|-------------|--------|
| Node.js | API Key in constructor | `X-API-Key` |
| Python | API Key in constructor | `X-API-Key` |

- Keys never logged or stored by SDK
- Support `PREDIXROUTE_API_KEY` environment variable
- Auto-retry on 429 with `Retry-After` header
- Auto-retry on 5xx with exponential backoff (max 3 retries)

## SDK Versioning

- SDK major version tracks API breaking changes
- SDK minor version adds new endpoints/features
- Deprecation warnings via response header `X-Deprecated: true`
