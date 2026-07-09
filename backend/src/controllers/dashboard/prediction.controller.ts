import { Request, Response, NextFunction } from 'express';
import { predictionService } from '../../services/prediction.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class DashboardPredictionController {
  evaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prediction = await predictionService.evaluateRisk(
        req.user!.organizationId,
        req.body,
        {
          source: 'DASHBOARD',
          requestId: req.requestId,
          apiEndpoint: '/dashboard/predictions/evaluate',
          usageEndpoint: '/dashboard/predictions/evaluate',
          triggerCodVerification: false,
          operationalLogOnly: true,
        },
      );
      sendSuccess(res, predictionService.mapToPublicResponse(prediction), 201);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await predictionService.listPredictions(req.user!.organizationId, page, limit);
      sendPaginated(res, {
        data: result.data.map((p) => predictionService.mapToPublicResponse(p)),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prediction = await predictionService.getPrediction(
        req.user!.organizationId,
        req.params.id!,
      );
      sendSuccess(res, predictionService.mapToPublicResponse(prediction));
    } catch (err) {
      next(err);
    }
  };

  batchEvaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await predictionService.evaluateBatch(
        req.user!.organizationId,
        req.body.items,
        {
          source: 'DASHBOARD',
          requestId: req.requestId,
          apiEndpoint: '/dashboard/predictions/batch',
          usageEndpoint: '/dashboard/predictions/batch',
          triggerCodVerification: false,
          operationalLogOnly: true,
        },
      );
      sendSuccess(res, { results, count: results.length }, 201);
    } catch (err) {
      next(err);
    }
  };

  evaluateAndVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await predictionService.evaluateAndVerify(
        req.user!.organizationId,
        req.body,
        {
          source: 'DASHBOARD',
          requestId: req.requestId,
          apiEndpoint: '/dashboard/predictions/evaluate-and-verify',
          usageEndpoint: '/dashboard/predictions/evaluate-and-verify',
          operationalLogOnly: true,
        },
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardPredictionController = new DashboardPredictionController();
