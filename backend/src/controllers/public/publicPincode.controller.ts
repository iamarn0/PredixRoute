import { Request, Response, NextFunction } from 'express';
import { pincodeService } from '../../services/pincode.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicPincodeController {
  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await pincodeService.getIntelligence(req.tenant!.organizationId, req.params.pincode!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}

export const publicPincodeController = new PublicPincodeController();
