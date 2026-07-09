import { Request, Response, NextFunction } from 'express';
import { trainingContributionService } from '../../services/trainingContribution.service';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse';

export class AdminTrainingContributionController {
  listPending = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await trainingContributionService.listPendingReview(page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await trainingContributionService.approve(
        req.params.id!,
        req.user!.userId,
        req.body.notes,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await trainingContributionService.reject(
        req.params.id!,
        req.user!.userId,
        req.body.notes,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  merge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await trainingContributionService.merge(req.params.id!, req.user!.userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const adminTrainingContributionController = new AdminTrainingContributionController();
