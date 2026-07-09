# Phase 5 — Backend Architecture

## Layered Architecture

```
HTTP Request
    ↓
Routes → Middleware Chain
    ↓
Controller (HTTP concerns only)
    ↓
Service (Business logic, orchestration)
    ↓
Repository (Persistence, tenant scoping)
    ↓
Mongoose Model
```

**Rules:**
- Controllers NEVER import models directly.
- Services NEVER access `req`/`res`.
- Repositories NEVER contain business logic.
- All tenant queries go through `TenantScopedRepository`.

---

## Base Repository Pattern

```typescript
// backend/src/interfaces/repository.interface.ts
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IBaseRepository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findByPublicId(publicId: string, organizationId: string): Promise<T | null>;
  findAll(organizationId: string, options: PaginationOptions): Promise<PaginatedResult<T>>;
  create(data: Partial<T>, organizationId: string): Promise<T>;
  update(id: string, organizationId: string, data: Partial<T>): Promise<T | null>;
  softDelete(id: string, organizationId: string): Promise<boolean>;
}
```

```typescript
// backend/src/repositories/base.repository.ts
export abstract class TenantScopedRepository<T extends Document & { organizationId: Types.ObjectId }>
  implements IBaseRepository<T> {

  constructor(protected model: Model<T>) {}

  protected scope(organizationId: string, filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...filter, organizationId: new Types.ObjectId(organizationId), deletedAt: null };
  }

  async findById(id: string, organizationId: string): Promise<T | null> {
    return this.model.findOne(this.scope(organizationId, { _id: id })).lean();
  }

  async findByPublicId(publicId: string, organizationId: string): Promise<T | null> {
    return this.model.findOne(this.scope(organizationId, { publicId } as FilterQuery<T>)).lean();
  }

  async findAll(organizationId: string, options: PaginationOptions): Promise<PaginatedResult<T>> {
    const { page, limit, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const filter = this.scope(organizationId);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: Partial<T>, organizationId: string): Promise<T> {
    const doc = await this.model.create({
      ...data,
      organizationId: new Types.ObjectId(organizationId),
      publicId: generatePublicId(this.getPrefix()),
    });
    return doc.toObject();
  }

  protected abstract getPrefix(): string;
}
```

---

## Service Abstraction Example

```typescript
// backend/src/services/prediction.service.ts
export class PredictionService {
  constructor(
    private predictionRepo: PredictionRepository,
    private shipmentRepo: ShipmentRepository,
    private aiOrchestrator: AiOrchestratorService,
    private apiUsageService: ApiUsageService,
    private eventBus: EventBus,
  ) {}

  async evaluateRisk(
    organizationId: string,
    input: RiskEvaluateInput,
    context: { source: PredictionSource; apiKeyId?: string; userId?: string },
  ): Promise<PredictionResult> {
    // 1. Check subscription limits
    await this.apiUsageService.checkPredictionLimit(organizationId);

    // 2. Call AI service (internal)
    const startMs = Date.now();
    const aiResult = await this.aiOrchestrator.predictRisk(organizationId, input);
    const latencyMs = Date.now() - startMs;

    // 3. Persist prediction
    const prediction = await this.predictionRepo.create({
      input,
      output: aiResult.output,
      explanations: aiResult.explanations,
      modelId: aiResult.modelId,
      modelVersion: aiResult.modelVersion,
      source: context.source,
      apiKeyId: context.apiKeyId,
      latencyMs,
    }, organizationId);

    // 4. Emit event
    this.eventBus.emit('prediction.created', {
      predictionId: prediction.publicId,
      organizationId,
      riskLevel: prediction.output.riskLevel,
    });

    // 5. Increment usage
    await this.apiUsageService.incrementUsage(organizationId, context.apiKeyId, '/public/risk/evaluate');

    return prediction;
  }
}
```

---

## AI Orchestrator Service

```typescript
// backend/src/services/aiOrchestrator.service.ts
export class AiOrchestratorService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aiService.url,
      timeout: 30000,
      headers: { 'X-Internal-Token': config.aiService.internalToken },
    });
  }

  async predictRisk(organizationId: string, input: RiskEvaluateInput): Promise<AiPredictionResponse> {
    const { data } = await this.client.post('/internal/v1/predict/risk', {
      organization_id: organizationId,
      ...input,
    });
    return data;
  }

  async recommendCourier(organizationId: string, input: RecommendationInput): Promise<AiRecommendationResponse> {
    const { data } = await this.client.post('/internal/v1/recommend/courier', {
      organization_id: organizationId,
      ...input,
    });
    return data;
  }
}
```

---

## Error Handling Architecture

```typescript
// backend/src/utils/apiError.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(code: string, message: string, details?: Record<string, unknown>) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = 'AUTH_REQUIRED', message = 'Authentication required') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static tooManyRequests(message = 'Rate limit exceeded') {
    return new ApiError(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}
```

```typescript
// backend/src/middleware/errorHandler.middleware.ts
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (err instanceof ApiError) {
    logger.warn({ requestId, code: err.code, statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten().fieldErrors,
      },
      requestId,
    });
  }

  logger.error({ requestId, err: err.message, stack: err.stack });
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    requestId,
  });
}
```

---

## Validation Architecture

```typescript
// backend/src/middleware/validate.middleware.ts
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw result.error; // caught by errorHandler
    }
    req[source] = result.data;
    next();
  };
}
```

```typescript
// backend/src/validators/public/riskEvaluate.validator.ts
export const riskEvaluateSchema = z.object({
  destinationPincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
  weightGrams: z.number().int().min(1).max(50000),
  cod: z.boolean(),
  codAmount: z.number().positive().nullable().optional(),
  orderValue: z.number().positive(),
  addressQualityScore: z.number().min(0).max(1),
  availableCouriers: z.array(z.string().min(1)).min(1).max(20),
  externalRef: z.string().max(100).optional(),
}).refine(
  (data) => !data.cod || (data.codAmount && data.codAmount > 0),
  { message: 'codAmount required when cod is true', path: ['codAmount'] },
);
```

---

## Controller Pattern

```typescript
// backend/src/controllers/public/publicRisk.controller.ts
export class PublicRiskController {
  constructor(private predictionService: PredictionService) {}

  evaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.predictionService.evaluateRisk(
        req.tenant!.organizationId,
        req.body,
        { source: 'PUBLIC_API', apiKeyId: req.apiKey!._id.toString() },
      );
      res.status(200).json({ success: true, data: mapPredictionResponse(result) });
    } catch (err) {
      next(err);
    }
  };
}
```

---

## Dependency Injection (Manual)

```typescript
// backend/src/app.ts
export function createApp() {
  const app = express();

  // Repositories
  const predictionRepo = new PredictionRepository(PredictionModel);
  const apiUsageRepo = new ApiUsageRepository(ApiUsageModel);

  // Services
  const aiOrchestrator = new AiOrchestratorService();
  const apiUsageService = new ApiUsageService(apiUsageRepo, apiSubscriptionRepo);
  const predictionService = new PredictionService(predictionRepo, shipmentRepo, aiOrchestrator, apiUsageService, eventBus);

  // Controllers
  const publicRiskController = new PublicRiskController(predictionService);

  // Routes
  app.use('/api/v1/public', createPublicRoutes(publicRiskController, ...));

  app.use(errorHandler);
  return app;
}
```

---

## Module Boundaries (Future Microservice Extraction)

| Module | Routes Prefix | Extractable |
|--------|--------------|-------------|
| Auth | `/api/v1/auth` | Yes → Auth Service |
| Dashboard | `/api/v1/dashboard` | Core |
| Public API | `/api/v1/public` | Yes → API Gateway Service |
| Admin | `/api/v1/admin` | Yes → Admin Service |
| Webhooks | Internal workers | Yes → Webhook Service |

Each module has its own `controllers/`, `services/`, `repositories/` subfolder grouping for clean extraction.
