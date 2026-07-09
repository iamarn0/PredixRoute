import { Request, Response, NextFunction } from 'express';
import { datasetService } from '../../services/dataset.service';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class DatasetController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await datasetService.list(req.tenant!.organizationId, page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await datasetService.get(req.tenant!.organizationId, req.params.id!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequest('NO_FILE', 'CSV file is required'));
      }
      const name = req.body.name || req.file.originalname.replace(/\.csv$/i, '');
      const description = req.body.description;
      const result = await datasetService.upload(
        req.tenant!.organizationId,
        req.user!.userId,
        req.file,
        name,
        description,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await datasetService.preview(req.tenant!.organizationId, req.params.id!);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  train = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await datasetService.startTraining(req.tenant!.organizationId, req.params.id!);
      sendSuccess(res, result, 202);
    } catch (err) {
      next(err);
    }
  };

  template = async (_req: Request, res: Response) => {
    const csv = datasetService.getTemplateCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="predixroute-training-template.csv"');
    res.send(csv);
  };
}

export const datasetController = new DatasetController();
