import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../../services/settings.service';
import { sendSuccess } from '../../utils/apiResponse';

export class SettingsController {
  getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await settingsService.getOrganization(req.tenant!.organizationId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await settingsService.updateOrganization(
        req.tenant!.organizationId,
        req.body,
        req.user!.userId,
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  updateTrainingConsent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await settingsService.updateTrainingConsent(
        req.tenant!.organizationId,
        req.user!.userId,
        req.body,
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  triggerTrainingSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingDataSyncQueue } = await import('../../jobs/queues.js');
      await trainingDataSyncQueue.add('sync-org-manual', {
        type: 'sync_org',
        organizationId: req.tenant!.organizationId,
      });
      sendSuccess(res, { message: 'Training data sync queued' });
    } catch (err) {
      next(err);
    }
  };
}

export const settingsController = new SettingsController();
