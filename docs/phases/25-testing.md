# Phase 25 — Testing Strategy

## Test Pyramid

```
         ╱  E2E Tests  ╲          ~5%  (Critical user flows)
        ╱ Integration Tests ╲      ~25% (API + DB + Redis)
       ╱   Service Tests     ╲     ~30% (Business logic)
      ╱    Repository Tests    ╲    ~20% (Data access)
     ╱      Unit Tests          ╲   ~20% (Utils, validators)
```

## Test Infrastructure

```typescript
// backend/tests/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import Redis from 'ioredis-mock';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Unit Tests

### Validators

```typescript
// backend/tests/unit/validators/riskEvaluate.validator.test.ts
describe('riskEvaluateSchema', () => {
  it('accepts valid input', () => {
    const result = riskEvaluateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects invalid pincode', () => {
    const result = riskEvaluateSchema.safeParse({ ...validInput, destinationPincode: '12345' });
    expect(result.success).toBe(false);
  });

  it('requires codAmount when cod is true', () => {
    const result = riskEvaluateSchema.safeParse({ ...validInput, cod: true, codAmount: null });
    expect(result.success).toBe(false);
  });
});
```

### Utils

```typescript
describe('passwordUtils', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('SecureP@ss1');
    expect(await verifyPassword('SecureP@ss1', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('riskLevelUtils', () => {
  it.each([
    [10, 'LOW'], [30, 'MEDIUM'], [60, 'HIGH'], [80, 'CRITICAL'],
  ])('classifies %i as %s', (score, expected) => {
    expect(classifyRisk(score)).toBe(expected);
  });
});
```

## Repository Tests

```typescript
// backend/tests/integration/repositories/prediction.repository.test.ts
describe('PredictionRepository', () => {
  let repo: PredictionRepository;
  const orgId = new Types.ObjectId().toString();

  beforeEach(() => {
    repo = new PredictionRepository(PredictionModel);
  });

  it('scopes queries to organizationId', async () => {
    await repo.create(predictionData, orgId);
    await repo.create(predictionData, new Types.ObjectId().toString());

    const result = await repo.findAll(orgId, { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].organizationId.toString()).toBe(orgId);
  });

  it('returns paginated results', async () => {
    for (let i = 0; i < 25; i++) {
      await repo.create(predictionData, orgId);
    }
    const result = await repo.findAll(orgId, { page: 2, limit: 10 });
    expect(result.data).toHaveLength(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.hasNext).toBe(true);
  });
});
```

## Service Tests

```typescript
// backend/tests/unit/services/prediction.service.test.ts
describe('PredictionService', () => {
  let service: PredictionService;
  let mockAiOrchestrator: jest.Mocked<AiOrchestratorService>;
  let mockApiUsage: jest.Mocked<ApiUsageService>;

  beforeEach(() => {
    mockAiOrchestrator = { predictRisk: jest.fn() } as any;
    mockApiUsage = { checkPredictionLimit: jest.fn(), incrementUsage: jest.fn() } as any;
    service = new PredictionService(predictionRepo, shipmentRepo, mockAiOrchestrator, mockApiUsage, eventBus);
  });

  it('calls AI service and persists prediction', async () => {
    mockAiOrchestrator.predictRisk.mockResolvedValue(mockAiResponse);

    const result = await service.evaluateRisk(orgId, validInput, { source: 'PUBLIC_API' });

    expect(mockAiOrchestrator.predictRisk).toHaveBeenCalledWith(orgId, validInput);
    expect(result.output.riskLevel).toBe('LOW');
    expect(mockApiUsage.incrementUsage).toHaveBeenCalled();
  });

  it('throws when quota exceeded', async () => {
    mockApiUsage.checkPredictionLimit.mockRejectedValue(new ApiError(429, 'QUOTA_EXCEEDED'));

    await expect(service.evaluateRisk(orgId, validInput, { source: 'PUBLIC_API' }))
      .rejects.toThrow('QUOTA_EXCEEDED');
  });
});
```

## Authentication Tests

```typescript
describe('Auth Flow', () => {
  it('registers user and sends verification email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validRegistration);
    expect(res.status).toBe(201);
    expect(mockEmailService.send).toHaveBeenCalledWith(expect.objectContaining({ template: 'verify-email' }));
  });

  it('locks account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong' });
    }
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong' });
    expect(res.status).toBe(423);
  });

  it('rotates refresh token on refresh', async () => {
    const login = await request(app).post('/api/v1/auth/login').send(validCredentials);
    const refreshCookie = login.headers['set-cookie'];

    const refresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie);
    expect(refresh.status).toBe(200);
    expect(refresh.headers['set-cookie']).not.toEqual(refreshCookie);
  });
});
```

## RBAC Tests

```typescript
describe('RBAC', () => {
  it('denies ANALYST from creating API keys', async () => {
    const token = generateTestToken({ role: 'ANALYST' });
    const res = await request(app)
      .post('/api/v1/dashboard/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'test' });
    expect(res.status).toBe(403);
  });

  it('allows ORGANIZATION_ADMIN to create API keys', async () => {
    const token = generateTestToken({ role: 'ORGANIZATION_ADMIN' });
    const res = await request(app)
      .post('/api/v1/dashboard/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'test', environment: 'TEST' });
    expect(res.status).toBe(201);
  });
});
```

## API Tests (Integration)

```typescript
describe('Public Risk API', () => {
  it('evaluates risk with valid API key', async () => {
    const res = await request(app)
      .post('/api/v1/public/risk/evaluate')
      .set('X-API-Key', testApiKey)
      .send(validRiskInput);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('riskScore');
    expect(res.body.data).toHaveProperty('riskLevel');
    expect(res.body.data).toHaveProperty('explanations');
  });

  it('returns 429 when rate limited', async () => {
    // Exhaust rate limit
    for (let i = 0; i < 61; i++) {
      await request(app).post('/api/v1/public/risk/evaluate').set('X-API-Key', testApiKey).send(validRiskInput);
    }
    const res = await request(app).post('/api/v1/public/risk/evaluate').set('X-API-Key', testApiKey).send(validRiskInput);
    expect(res.status).toBe(429);
  });
});
```

## AI Service Tests

```python
# ai-service/tests/test_inference.py
def test_feature_pipeline_produces_28_features():
    pipeline = FeaturePipeline()
    features = pipeline.transform(valid_input, org_id="test")
    assert len(features) == 28

def test_risk_classification():
    assert classify_risk(10) == "LOW"
    assert classify_risk(80) == "CRITICAL"

def test_model_selection_picks_highest_f1():
    results = create_mock_results()
    best = select_best_model(results)
    assert best.algorithm == "XGBOOST"
```

## Webhook Tests

```typescript
describe('Webhook Delivery', () => {
  it('signs payload with HMAC-SHA256', () => {
    const signature = signWebhookPayload(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('retries on 5xx response', async () => {
    mockHttp.post.mockRejectedValueOnce({ response: { status: 503 } });
    mockHttp.post.mockResolvedValueOnce({ status: 200 });

    await processWebhook(mockJob);
    expect(mockHttp.post).toHaveBeenCalledTimes(2);
  });

  it('disables webhook after 10 consecutive failures', async () => {
    // Simulate 10 failures
    for (let i = 0; i < 10; i++) {
      await webhookRepo.incrementFailure(webhookId, orgId);
    }
    const webhook = await webhookRepo.findById(webhookId, orgId);
    expect(webhook.status).toBe('FAILING');
  });
});
```

## CI Test Commands

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration --runInBand",
    "test:ai": "cd ../ai-service && pytest --cov=app"
  }
}
```

**Coverage targets:** 80% overall, 90% for services and validators.
