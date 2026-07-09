import { Request, Response, NextFunction } from 'express';
import { trainingContributionService } from '../../services/trainingContribution.service';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse';

export class DashboardTrainingContributionController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await trainingContributionService.list(req.user!.organizationId, page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await trainingContributionService.get(req.user!.organizationId, req.params.id!);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'FILE_REQUIRED', message: 'CSV file required' } });
        return;
      }
      const result = await trainingContributionService.uploadCsv(
        req.user!.organizationId,
        req.user!.userId,
        req.file,
        req.body.name,
        req.body.description,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardTrainingContributionController = new DashboardTrainingContributionController();
