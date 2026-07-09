import { Request, Response, NextFunction } from 'express';
import { predictionService } from '../../services/prediction.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicRiskController {
  evaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.tenant!.organizationId;
      const prediction = await predictionService.evaluateRisk(organizationId, req.body, {
        source: 'PUBLIC_API',
        apiKeyId: req.apiKey?._id,
        requestId: req.requestId,
        apiEndpoint: '/public/risk/evaluate',
        usageEndpoint: '/public/risk/evaluate',
        triggerCodVerification: false,
        operationalLogOnly: true,
      });

      sendSuccess(res, predictionService.mapToPublicResponse(prediction));
    } catch (err) {
      next(err);
    }
  };

  evaluateAndVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.tenant!.organizationId;
      const result = await predictionService.evaluateAndVerify(organizationId, req.body, {
        source: 'PUBLIC_API',
        apiKeyId: req.apiKey?._id,
        requestId: req.requestId,
        apiEndpoint: '/public/risk/evaluate-and-verify',
        usageEndpoint: '/public/risk/evaluate-and-verify',
        operationalLogOnly: true,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  batchEvaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.tenant!.organizationId;
      const results = await predictionService.evaluateBatch(organizationId, req.body.items, {
        source: 'PUBLIC_API',
        apiKeyId: req.apiKey?._id,
        requestId: req.requestId,
        apiEndpoint: '/public/batch/evaluate',
        usageEndpoint: '/public/batch/evaluate',
        triggerCodVerification: false,
        operationalLogOnly: true,
      });
      sendSuccess(res, { results, count: results.length }, 201);
    } catch (err) {
      next(err);
    }
  };

  batchEvaluateAndVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.tenant!.organizationId;
      const results = await predictionService.evaluateBatchAndVerify(organizationId, req.body.items, {
        source: 'PUBLIC_API',
        apiKeyId: req.apiKey?._id,
        requestId: req.requestId,
        apiEndpoint: '/public/batch/evaluate-and-verify',
        usageEndpoint: '/public/batch/evaluate-and-verify',
        operationalLogOnly: true,
      });
      sendSuccess(res, { results, count: results.length }, 201);
    } catch (err) {
      next(err);
    }
  };

  demoEvaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await predictionService.evaluateDemo(req.body, req.requestId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const publicRiskController = new PublicRiskController();
