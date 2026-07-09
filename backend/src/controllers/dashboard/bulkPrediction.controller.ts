import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { bulkPredictionService } from '../../services/bulkPrediction.service';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse';

export class DashboardBulkPredictionController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await bulkPredictionService.list(req.user!.organizationId, page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bulkPredictionService.get(req.user!.organizationId, req.params.id!);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'FILE_REQUIRED', message: 'CSV or Excel file required' } });
        return;
      }
      const couriers = Array.isArray(req.body.availableCouriers)
        ? req.body.availableCouriers
        : String(req.body.availableCouriers ?? '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);

      const result = await bulkPredictionService.createUploadJob(
        req.user!.organizationId,
        req.user!.userId,
        req.file,
        req.body.name,
        couriers,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path: filePath, filename } = await bulkPredictionService.getDownloadPath(
        req.user!.organizationId,
        req.params.id!,
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      next(err);
    }
  };

  template = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { path: filePath, filename } = bulkPredictionService.getTemplatePath();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardBulkPredictionController = new DashboardBulkPredictionController();
