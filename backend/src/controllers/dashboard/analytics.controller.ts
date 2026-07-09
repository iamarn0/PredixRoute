import { Request, Response, NextFunction } from 'express';
import { apiUsageService } from '../../services/apiUsage.service';
import { sendSuccess } from '../../utils/apiResponse';

export class AnalyticsController {
  usage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await apiUsageService.getUsageSummary(req.user!.organizationId);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  };
}

export const analyticsController = new AnalyticsController();
