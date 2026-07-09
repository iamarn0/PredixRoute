import { Request, Response, NextFunction } from 'express';
import { pincodeService } from '../../services/pincode.service';
import { courierService } from '../../services/courier.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export class DashboardIntelligenceController {
  listPincodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await pincodeService.listPincodes(req.user!.organizationId, page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getPincode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await pincodeService.getIntelligence(req.user!.organizationId, req.params.pincode!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  listCouriers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await courierService.listCouriers(req.user!.organizationId, page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getCourier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await courierService.getIntelligence(req.user!.organizationId, req.params.code!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardIntelligenceController = new DashboardIntelligenceController();
