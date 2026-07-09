import { Request, Response, NextFunction } from 'express';
import { codVerificationService } from '../../services/codVerification.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicCodVerificationController {
  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await codVerificationService.startManual(req.tenant!.organizationId, req.body);
      sendSuccess(res, session, 201);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await codVerificationService.getByPublicId(
        req.tenant!.organizationId,
        req.params.id!,
        false,
      );
      sendSuccess(res, session);
    } catch (err) {
      next(err);
    }
  };
}

export const publicCodVerificationController = new PublicCodVerificationController();
