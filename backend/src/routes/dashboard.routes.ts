import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, rbacMiddleware } from '../middleware/auth.middleware';
import { tenantStatusMiddleware } from '../middleware/tenant.middleware';
import { validate } from '../middleware/errorHandler.middleware';
import { riskEvaluateSchema, batchEvaluateSchema } from '../validators/public/riskEvaluate.validator';
import {
  createApiKeySchema,
  pincodeParamSchema,
  createWebhookSchema,
  updateOrganizationSchema,
} from '../validators/dashboard.validator';
import {
  startCodVerificationSchema,
  codVerificationParamSchema,
  codVerificationListQuerySchema,
  resolveCodVerificationSchema,
} from '../validators/codVerification.validator';
import {
  trainingContributionUploadSchema,
  bulkPredictionUploadSchema,
  trainingConsentSchema,
} from '../validators/shipmentOutcome.validator';
import { dashboardPredictionController } from '../controllers/dashboard/prediction.controller';
import { dashboardCodVerificationController } from '../controllers/dashboard/codVerification.controller';
import { dashboardApiKeyController } from '../controllers/dashboard/apiKey.controller';
import { dashboardIntelligenceController } from '../controllers/dashboard/intelligence.controller';
import { analyticsController } from '../controllers/dashboard/analytics.controller';
import { webhookController } from '../controllers/dashboard/webhook.controller';
import { settingsController } from '../controllers/dashboard/settings.controller';
import { dashboardTrainingContributionController } from '../controllers/dashboard/trainingContribution.controller';
import { dashboardBulkPredictionController } from '../controllers/dashboard/bulkPrediction.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware, tenantStatusMiddleware);

router.post(
  '/predictions/evaluate',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(riskEvaluateSchema),
  dashboardPredictionController.evaluate,
);
router.post(
  '/predictions/evaluate-and-verify',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(riskEvaluateSchema),
  dashboardPredictionController.evaluateAndVerify,
);
router.get(
  '/predictions',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardPredictionController.list,
);
router.get(
  '/predictions/:id',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardPredictionController.getById,
);
router.post(
  '/predictions/batch',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(batchEvaluateSchema),
  dashboardPredictionController.batchEvaluate,
);

router.get(
  '/cod-verifications/messaging-config',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardCodVerificationController.messagingConfig,
);
router.get(
  '/cod-verifications',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(codVerificationListQuerySchema, 'query'),
  dashboardCodVerificationController.list,
);
router.get(
  '/cod-verifications/:id',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(codVerificationParamSchema, 'params'),
  dashboardCodVerificationController.getById,
);
router.post(
  '/cod-verifications',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(startCodVerificationSchema),
  dashboardCodVerificationController.start,
);
router.post(
  '/cod-verifications/:id/resolve',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  validate(codVerificationParamSchema, 'params'),
  validate(resolveCodVerificationSchema),
  dashboardCodVerificationController.resolve,
);

router.get(
  '/bulk-predictions',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardBulkPredictionController.list,
);
router.get(
  '/bulk-predictions/template',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardBulkPredictionController.template,
);
router.get(
  '/bulk-predictions/:id',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardBulkPredictionController.getById,
);
router.get(
  '/bulk-predictions/:id/download',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardBulkPredictionController.download,
);
router.post(
  '/bulk-predictions/upload',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  upload.single('file'),
  validate(bulkPredictionUploadSchema),
  dashboardBulkPredictionController.upload,
);

router.get(
  '/datasets/training-contributions',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  dashboardTrainingContributionController.list,
);
router.get(
  '/datasets/training-contributions/:id',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  dashboardTrainingContributionController.getById,
);
router.post(
  '/datasets/training-contributions',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  upload.single('file'),
  validate(trainingContributionUploadSchema),
  dashboardTrainingContributionController.upload,
);

router.get(
  '/analytics/usage',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  analyticsController.usage,
);

router.get(
  '/pincodes',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardIntelligenceController.listPincodes,
);
router.get(
  '/pincodes/:pincode',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  validate(pincodeParamSchema, 'params'),
  dashboardIntelligenceController.getPincode,
);
router.get(
  '/couriers',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardIntelligenceController.listCouriers,
);
router.get(
  '/couriers/:code',
  rbacMiddleware('ORGANIZATION_ADMIN', 'ANALYST'),
  dashboardIntelligenceController.getCourier,
);

router.get('/api-keys', rbacMiddleware('ORGANIZATION_ADMIN'), dashboardApiKeyController.list);
router.post(
  '/api-keys',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  validate(createApiKeySchema),
  dashboardApiKeyController.create,
);
router.delete(
  '/api-keys/:id',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  dashboardApiKeyController.revoke,
);

router.get('/webhooks', rbacMiddleware('ORGANIZATION_ADMIN'), webhookController.list);
router.post(
  '/webhooks',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  validate(createWebhookSchema),
  webhookController.create,
);
router.delete(
  '/webhooks/:id',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  webhookController.remove,
);

router.get('/settings/organization', rbacMiddleware('ORGANIZATION_ADMIN'), settingsController.getOrganization);
router.patch(
  '/settings/organization',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  validate(updateOrganizationSchema),
  settingsController.updateOrganization,
);
router.post(
  '/settings/training-consent',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  validate(trainingConsentSchema),
  settingsController.updateTrainingConsent,
);
router.post(
  '/settings/training-sync',
  rbacMiddleware('ORGANIZATION_ADMIN'),
  settingsController.triggerTrainingSync,
);

export default router;
