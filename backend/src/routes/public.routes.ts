import { Router } from 'express';
import { publicHealthController } from '../controllers/public/publicHealth.controller';
import { publicRiskController } from '../controllers/public/publicRisk.controller';
import { publicPincodeController } from '../controllers/public/publicPincode.controller';
import { publicCourierController } from '../controllers/public/publicCourier.controller';
import { publicCodVerificationController } from '../controllers/public/publicCodVerification.controller';
import { publicShipmentOutcomeController } from '../controllers/public/publicShipmentOutcome.controller';
import { apiKeyAuthMiddleware } from '../middleware/apiKeyAuth.middleware';
import { tenantStatusMiddleware } from '../middleware/tenant.middleware';
import { demoRateLimitMiddleware } from '../middleware/demoRateLimit.middleware';
import { validate } from '../middleware/errorHandler.middleware';
import { riskEvaluateSchema, batchEvaluateSchema } from '../validators/public/riskEvaluate.validator';
import { pincodeParamSchema, courierParamSchema } from '../validators/dashboard.validator';
import { startCodVerificationSchema, codVerificationParamSchema } from '../validators/codVerification.validator';
import { shipmentOutcomeBatchSchema } from '../validators/shipmentOutcome.validator';

const router = Router();

router.get('/health', publicHealthController.health);

router.post(
  '/demo/risk/evaluate',
  demoRateLimitMiddleware,
  validate(riskEvaluateSchema),
  publicRiskController.demoEvaluate,
);

router.post(
  '/risk/evaluate',
  apiKeyAuthMiddleware('risk:evaluate'),
  tenantStatusMiddleware,
  validate(riskEvaluateSchema),
  publicRiskController.evaluate,
);

router.post(
  '/risk/evaluate-and-verify',
  apiKeyAuthMiddleware('cod:verify'),
  tenantStatusMiddleware,
  validate(riskEvaluateSchema),
  publicRiskController.evaluateAndVerify,
);

router.post(
  '/batch/evaluate',
  apiKeyAuthMiddleware('batch'),
  tenantStatusMiddleware,
  validate(batchEvaluateSchema),
  publicRiskController.batchEvaluate,
);

router.post(
  '/batch/evaluate-and-verify',
  apiKeyAuthMiddleware('cod:verify'),
  tenantStatusMiddleware,
  validate(batchEvaluateSchema),
  publicRiskController.batchEvaluateAndVerify,
);

router.post(
  '/shipments/outcome',
  apiKeyAuthMiddleware('risk:evaluate'),
  tenantStatusMiddleware,
  validate(shipmentOutcomeBatchSchema),
  publicShipmentOutcomeController.ingestBatch,
);

router.get(
  '/pincode/:pincode',
  apiKeyAuthMiddleware('pincode:read'),
  tenantStatusMiddleware,
  validate(pincodeParamSchema, 'params'),
  publicPincodeController.get,
);

router.get(
  '/courier/:courier',
  apiKeyAuthMiddleware('courier:read'),
  tenantStatusMiddleware,
  validate(courierParamSchema, 'params'),
  publicCourierController.get,
);

router.post(
  '/cod-verifications/start',
  apiKeyAuthMiddleware('cod:verify'),
  tenantStatusMiddleware,
  validate(startCodVerificationSchema),
  publicCodVerificationController.start,
);

router.get(
  '/cod-verifications/:id',
  apiKeyAuthMiddleware('cod:verify'),
  tenantStatusMiddleware,
  validate(codVerificationParamSchema, 'params'),
  publicCodVerificationController.getById,
);

export default router;
