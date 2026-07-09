import { Request, Response, NextFunction } from 'express';
import { codVerificationService } from '../../services/codVerification.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class DashboardCodVerificationController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const status = req.query.status as string | undefined;
      const result = await codVerificationService.list(
        req.user!.organizationId,
        page,
        limit,
        status as never,
      );
      sendPaginated(res, { data: result.data, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await codVerificationService.getByPublicId(
        req.user!.organizationId,
        req.params.id!,
        req.user!.role === 'ORGANIZATION_ADMIN',
      );
      sendSuccess(res, session);
    } catch (err) {
      next(err);
    }
  };

  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await codVerificationService.startManual(req.user!.organizationId, req.body);
      sendSuccess(res, session, 201);
    } catch (err) {
      next(err);
    }
  };

  messagingConfig = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, codVerificationService.getMessagingConfig());
    } catch (err) {
      next(err);
    }
  };

  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await codVerificationService.resolveManually(
        req.user!.organizationId,
        req.params.id!,
        req.body,
      );
      sendSuccess(res, session);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardCodVerificationController = new DashboardCodVerificationController();
