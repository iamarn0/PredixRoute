import { Request, Response, NextFunction } from 'express';
import { trainingContributionService } from '../../services/trainingContribution.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublicShipmentOutcomeController {
  ingestBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await trainingContributionService.ingestOutcomeApiBatch(
        req.tenant!.organizationId,
        req.body.shipments,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };
}

export const publicShipmentOutcomeController = new PublicShipmentOutcomeController();
