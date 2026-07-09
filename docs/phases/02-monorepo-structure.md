# Phase 2 — Complete Monorepo Structure

## Root Layout

```
predixroute/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci-backend.yml
│       ├── ci-frontend.yml
│       ├── ci-ai-service.yml
│       └── deploy-production.yml
├── frontend/
├── backend/
├── ai-service/
├── infrastructure/
├── sdk/
│   ├── nodejs/
│   └── python/
└── docs/
    ├── phases/           # This documentation set
    ├── openapi/
    ├── guides/
    └── diagrams/
```

---

## frontend/

```
frontend/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .env.example
├── public/
│   ├── favicon.ico
│   └── manifest.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── assets/
    │   ├── images/
    │   ├── icons/
    │   └── fonts/
    ├── components/
    │   ├── common/
    │   │   ├── Button/
    │   │   ├── DataTable/
    │   │   ├── Modal/
    │   │   ├── LoadingSpinner/
    │   │   ├── ErrorBoundary/
    │   │   ├── NotificationSnackbar/
    │   │   ├── ProtectedRoute/
    │   │   ├── PageHeader/
    │   │   └── EmptyState/
    │   └── charts/
    │       ├── RiskGaugeChart/
    │       ├── TrendLineChart/
    │       ├── CourierBarChart/
    │       ├── PincodeHeatmap/
    │       └── ApiUsageChart/
    ├── layouts/
    │   ├── MainLayout/
    │   │   ├── MainLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── TopBar.tsx
    │   │   └── Footer.tsx
    │   ├── AuthLayout/
    │   └── PublicLayout/
    ├── pages/
    │   ├── NotFoundPage.tsx
    │   └── UnauthorizedPage.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useTenant.ts
    │   ├── useTheme.ts
    │   ├── usePagination.ts
    │   ├── useDebounce.ts
    │   └── usePermissions.ts
    ├── services/
    │   ├── apiClient.ts          # Axios instance + interceptors
    │   ├── authService.ts
    │   ├── shipmentService.ts
    │   ├── predictionService.ts
    │   ├── courierService.ts
    │   ├── pincodeService.ts
    │   ├── datasetService.ts
    │   ├── reportService.ts
    │   ├── apiKeyService.ts
    │   ├── webhookService.ts
    │   └── analyticsService.ts
    ├── store/
    │   ├── authStore.ts          # Zustand or Context
    │   ├── themeStore.ts
    │   └── notificationStore.ts
    ├── routes/
    │   ├── index.tsx
    │   ├── authRoutes.tsx
    │   ├── dashboardRoutes.tsx
    │   └── adminRoutes.tsx
    ├── contexts/
    │   ├── AuthContext.tsx
    │   ├── ThemeContext.tsx
    │   └── NotificationContext.tsx
    ├── types/
    │   ├── auth.types.ts
    │   ├── shipment.types.ts
    │   ├── prediction.types.ts
    │   ├── api.types.ts
    │   └── common.types.ts
    ├── constants/
    │   ├── routes.constants.ts
    │   ├── roles.constants.ts
    │   ├── api.constants.ts
    │   └── theme.constants.ts
    ├── utils/
    │   ├── formatters.ts
    │   ├── validators.ts
    │   ├── dateUtils.ts
    │   ├── riskLevelUtils.ts
    │   └── exportUtils.ts
    └── modules/
        ├── auth/
        │   ├── pages/
        │   │   ├── LoginPage.tsx
        │   │   ├── RegisterPage.tsx
        │   │   ├── ForgotPasswordPage.tsx
        │   │   ├── ResetPasswordPage.tsx
        │   │   └── VerifyEmailPage.tsx
        │   └── components/
        │       ├── LoginForm.tsx
        │       └── RegisterForm.tsx
        ├── dashboard/
        │   ├── pages/
        │   │   ├── ExecutiveDashboardPage.tsx
        │   │   └── OverviewPage.tsx
        │   └── components/
        │       ├── KpiCard.tsx
        │       └── RecentPredictionsWidget.tsx
        ├── organizations/
        │   ├── pages/
        │   │   ├── OrganizationSettingsPage.tsx
        │   │   └── TeamManagementPage.tsx
        │   └── components/
        │       ├── InviteUserModal.tsx
        │       └── RoleSelector.tsx
        ├── shipments/
        │   ├── pages/
        │   │   ├── ShipmentListPage.tsx
        │   │   └── ShipmentDetailPage.tsx
        │   └── components/
        │       ├── ShipmentForm.tsx
        │       └── ShipmentRiskBadge.tsx
        ├── predictions/
        │   ├── pages/
        │   │   ├── PredictionListPage.tsx
        │   │   ├── PredictionDetailPage.tsx
        │   │   └── BatchEvaluatePage.tsx
        │   └── components/
        │       ├── PredictionCard.tsx
        │       ├── ShapExplanationPanel.tsx
        │       └── RiskScoreGauge.tsx
        ├── couriers/
        │   ├── pages/
        │   │   ├── CourierListPage.tsx
        │   │   └── CourierDetailPage.tsx
        │   └── components/
        │       ├── CourierPerformanceChart.tsx
        │       └── CourierComparisonTable.tsx
        ├── pincodes/
        │   ├── pages/
        │   │   ├── PincodeListPage.tsx
        │   │   └── PincodeDetailPage.tsx
        │   └── components/
        │       ├── PincodeRiskMap.tsx
        │       └── PincodeTrendChart.tsx
        ├── datasets/
        │   ├── pages/
        │   │   ├── DatasetListPage.tsx
        │   │   ├── DatasetUploadPage.tsx
        │   │   └── DatasetDetailPage.tsx
        │   └── components/
        │       ├── CsvUploader.tsx
        │       ├── SchemaPreview.tsx
        │       └── DataQualityReport.tsx
        ├── reports/
        │   ├── pages/
        │   │   ├── ReportListPage.tsx
        │   │   └── ReportGeneratePage.tsx
        │   └── components/
        │       ├── ReportScheduler.tsx
        │       └── ReportDownloadButton.tsx
        ├── api-management/
        │   ├── pages/
        │   │   ├── ApiKeysPage.tsx
        │   │   ├── ApiUsagePage.tsx
        │   │   ├── WebhooksPage.tsx
        │   │   └── ApiDocumentationPage.tsx
        │   └── components/
        │       ├── ApiKeyGenerator.tsx
        │       ├── UsageMeterChart.tsx
        │       └── WebhookConfigForm.tsx
        ├── billing/
        │   ├── pages/
        │   │   ├── PlansPage.tsx
        │   │   └── SubscriptionPage.tsx
        │   └── components/
        │       └── PlanComparisonTable.tsx
        └── settings/
            ├── pages/
            │   ├── ProfileSettingsPage.tsx
            │   ├── SecuritySettingsPage.tsx
            │   └── NotificationSettingsPage.tsx
            └── components/
                ├── PasswordChangeForm.tsx
                └── SessionList.tsx
```

---

## backend/

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── jest.config.ts
├── src/
│   ├── index.ts                    # Entry point
│   ├── app.ts                      # Express app factory
│   ├── server.ts                   # HTTP server bootstrap
│   ├── config/
│   │   ├── index.ts                # Config aggregator (dotenv + validation)
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   ├── aws.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── organization.controller.ts
│   │   ├── shipment.controller.ts
│   │   ├── prediction.controller.ts
│   │   ├── courier.controller.ts
│   │   ├── pincode.controller.ts
│   │   ├── dataset.controller.ts
│   │   ├── model.controller.ts
│   │   ├── report.controller.ts
│   │   ├── webhook.controller.ts
│   │   ├── apiKey.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── billing.controller.ts
│   │   └── public/
│   │       ├── publicRisk.controller.ts
│   │       ├── publicRecommendation.controller.ts
│   │       ├── publicBatch.controller.ts
│   │       ├── publicPincode.controller.ts
│   │       ├── publicCourier.controller.ts
│   │       └── publicHealth.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── organization.service.ts
│   │   ├── shipment.service.ts
│   │   ├── prediction.service.ts
│   │   ├── courier.service.ts
│   │   ├── pincode.service.ts
│   │   ├── dataset.service.ts
│   │   ├── model.service.ts
│   │   ├── report.service.ts
│   │   ├── webhook.service.ts
│   │   ├── apiKey.service.ts
│   │   ├── apiUsage.service.ts
│   │   ├── analytics.service.ts
│   │   ├── billing.service.ts
│   │   ├── email.service.ts
│   │   ├── s3.service.ts
│   │   └── aiOrchestrator.service.ts   # Calls FastAPI internal endpoints
│   ├── repositories/
│   │   ├── base.repository.ts          # TenantScopedRepository<T>
│   │   ├── user.repository.ts
│   │   ├── organization.repository.ts
│   │   ├── shipment.repository.ts
│   │   ├── prediction.repository.ts
│   │   ├── courierPerformance.repository.ts
│   │   ├── pincodePerformance.repository.ts
│   │   ├── dataset.repository.ts
│   │   ├── model.repository.ts
│   │   ├── report.repository.ts
│   │   ├── webhook.repository.ts
│   │   ├── apiKey.repository.ts
│   │   ├── apiUsage.repository.ts
│   │   ├── auditLog.repository.ts
│   │   └── notificationLog.repository.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── organization.model.ts
│   │   ├── apiKey.model.ts
│   │   ├── apiUsage.model.ts
│   │   ├── apiPlan.model.ts
│   │   ├── apiSubscription.model.ts
│   │   ├── shipment.model.ts
│   │   ├── prediction.model.ts
│   │   ├── courierPerformance.model.ts
│   │   ├── pincodePerformance.model.ts
│   │   ├── dataset.model.ts
│   │   ├── model.model.ts
│   │   ├── webhook.model.ts
│   │   ├── report.model.ts
│   │   ├── auditLog.model.ts
│   │   └── notificationLog.model.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── tenantContext.middleware.ts
│   │   ├── apiKeyAuth.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── requestId.middleware.ts
│   │   ├── auditLog.middleware.ts
│   │   └── csrf.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── public.routes.ts
│   │   └── admin.routes.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── shipment.validator.ts
│   │   ├── prediction.validator.ts
│   │   ├── dataset.validator.ts
│   │   ├── webhook.validator.ts
│   │   └── public/
│   │       ├── riskEvaluate.validator.ts
│   │       ├── recommendation.validator.ts
│   │       └── batchEvaluate.validator.ts
│   ├── jobs/
│   │   ├── queue.ts                  # BullMQ queue definitions
│   │   ├── worker.ts                 # Worker bootstrap
│   │   └── processors/
│   │       ├── datasetProcessing.processor.ts
│   │       ├── modelTraining.processor.ts
│   │       ├── reportGeneration.processor.ts
│   │       ├── webhookDelivery.processor.ts
│   │       ├── emailSending.processor.ts
│   │       └── cleanup.processor.ts
│   ├── events/
│   │   ├── eventBus.ts
│   │   ├── eventTypes.ts
│   │   └── handlers/
│   │       ├── webhookEvent.handler.ts
│   │       ├── auditEvent.handler.ts
│   │       └── notificationEvent.handler.ts
│   ├── interfaces/
│   │   ├── repository.interface.ts
│   │   ├── service.interface.ts
│   │   ├── pagination.interface.ts
│   │   └── aiService.interface.ts
│   ├── types/
│   │   ├── express.d.ts              # Extend Request with tenant, user
│   │   ├── auth.types.ts
│   │   ├── prediction.types.ts
│   │   └── api.types.ts
│   └── utils/
│       ├── apiError.ts
│       ├── apiResponse.ts
│       ├── passwordUtils.ts
│       ├── tokenUtils.ts
│       ├── paginationUtils.ts
│       └── logger.ts
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## ai-service/

```
ai-service/
├── requirements.txt
├── pyproject.toml
├── .env.example
├── Dockerfile
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py             # Internal token validation
│   │   ├── dependencies.py
│   │   └── logging.py
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       ├── predict.py
│   │       ├── recommend.py
│   │       ├── explain.py
│   │       ├── train.py
│   │       ├── models.py
│   │       └── health.py
│   ├── schemas/
│   │   ├── predict.py
│   │   ├── recommend.py
│   │   ├── explain.py
│   │   ├── train.py
│   │   └── common.py
│   ├── services/
│   │   ├── inference_service.py
│   │   ├── recommendation_service.py
│   │   ├── explainability_service.py
│   │   ├── training_service.py
│   │   └── model_registry_service.py
│   ├── ml/
│   │   ├── pipelines/
│   │   │   ├── training_pipeline.py
│   │   │   ├── validation_pipeline.py
│   │   │   └── inference_pipeline.py
│   │   ├── features/
│   │   │   ├── feature_pipeline.py
│   │   │   ├── pincode_features.py
│   │   │   ├── courier_features.py
│   │   │   ├── cod_features.py
│   │   │   ├── weight_features.py
│   │   │   ├── address_features.py
│   │   │   └── temporal_features.py
│   │   ├── models/
│   │   │   ├── logistic_regression_model.py
│   │   │   ├── random_forest_model.py
│   │   │   ├── xgboost_model.py
│   │   │   └── model_selector.py
│   │   └── explainability/
│   │       ├── shap_explainer.py
│   │       └── explanation_formatter.py
│   └── models/                     # Serialized model artifacts (.joblib)
│       └── registry/
│           ├── metadata.json
│           └── versions/
└── tests/
    ├── test_inference.py
    ├── test_features.py
    ├── test_training.py
    └── test_shap.py
```

---

## infrastructure/

```
infrastructure/
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── Dockerfile.ai-service
│   └── mongo-init.js
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       ├── predixroute.conf
│       └── ssl.conf
├── aws/
│   ├── cloudformation/
│   │   ├── ec2-asg.yaml
│   │   ├── s3-buckets.yaml
│   │   └── cloudwatch-alarms.yaml
│   ├── user-data.sh
│   └── deploy.sh
├── github-actions/
│   ├── ci-backend.yml
│   ├── ci-frontend.yml
│   ├── ci-ai-service.yml
│   └── deploy-production.yml
└── scripts/
    ├── seed-dev-data.ts
    ├── migrate-indexes.ts
    └── backup-mongodb.sh
```

---

## sdk/

```
sdk/
├── nodejs/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── resources/
│   │   │   ├── risk.ts
│   │   │   ├── recommendation.ts
│   │   │   ├── batch.ts
│   │   │   ├── pincode.ts
│   │   │   └── courier.ts
│   │   ├── types/
│   │   └── errors/
│   └── README.md
└── python/
    ├── pyproject.toml
    ├── predixroute/
    │   ├── __init__.py
    │   ├── client.py
    │   ├── resources/
    │   │   ├── risk.py
    │   │   ├── recommendation.py
    │   │   ├── batch.py
    │   │   ├── pincode.py
    │   │   └── courier.py
    │   ├── types.py
    │   └── exceptions.py
    └── README.md
```

---

## docs/

```
docs/
├── phases/                         # 01–27 architecture documents
├── openapi/
│   ├── public-api.yaml
│   └── dashboard-api.yaml
├── guides/
│   ├── getting-started.md
│   ├── authentication.md
│   ├── ml-pipeline.md
│   ├── webhooks.md
│   ├── sdk-nodejs.md
│   ├── sdk-python.md
│   └── deployment.md
└── diagrams/
    ├── er-diagram.mmd
    ├── system-context.mmd
    └── deployment.mmd
```

---

## Package Boundaries & Dependency Rules

| Rule | Enforcement |
|------|-------------|
| Frontend → Backend only | No AI service URL in frontend env |
| Backend → AI Service (internal) | `AI_SERVICE_URL` env, internal token |
| AI Service → MongoDB (read-only perf data) | Optional read replica for features |
| SDK → Public API only | Same contracts as external integrators |
| No cross-import between packages | Independent package.json / requirements.txt |

## Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| Controllers | `{domain}.controller.ts` | `prediction.controller.ts` |
| Services | `{domain}.service.ts` | `prediction.service.ts` |
| Repositories | `{domain}.repository.ts` | `prediction.repository.ts` |
| Models | `{domain}.model.ts` | `prediction.model.ts` |
| Validators | `{domain}.validator.ts` | `prediction.validator.ts` |
| React modules | `{Domain}{Type}` | `PredictionListPage.tsx` |
| Python modules | `snake_case` | `inference_service.py` |
