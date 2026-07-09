import { Request, Response, NextFunction } from 'express';
import { courierService } from '../../services/courier.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicCourierController {
  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await courierService.getIntelligence(req.tenant!.organizationId, req.params.courier!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}

export const publicCourierController = new PublicCourierController();
