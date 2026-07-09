import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../../services/webhook.service';
import { sendSuccess } from '../../utils/apiResponse';

export class WebhookController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await webhookService.list(req.tenant!.organizationId);
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await webhookService.create(
        req.tenant!.organizationId,
        req.body.url,
        req.body.events,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await webhookService.remove(req.tenant!.organizationId, req.params.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const webhookController = new WebhookController();
