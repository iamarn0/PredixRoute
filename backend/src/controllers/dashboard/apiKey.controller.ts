import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../../services/apiKey.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DashboardApiKeyController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keys = await apiKeyService.listKeys(req.user!.organizationId);
      sendSuccess(res, keys);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await apiKeyService.createKey(req.user!.organizationId, req.user!.userId, req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await apiKeyService.revokeKey(req.user!.organizationId, req.params.id!);
      sendSuccess(res, { message: 'API key revoked' });
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardApiKeyController = new DashboardApiKeyController();
