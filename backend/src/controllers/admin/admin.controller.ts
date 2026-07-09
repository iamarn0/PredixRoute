import { Request, Response, NextFunction } from 'express';
import { adminService } from '../../services/admin.service';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class AdminController {
  listOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const result = await adminService.listOrganizations(
        page,
        limit,
        search,
        status as 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED' | undefined,
      );
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.getOrganization(req.params.id!);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateOrganizationStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.updateOrganizationStatus(req.params.id!, req.body.status);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined;
      const result = await adminService.listUsers(page, limit, search, organizationId);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  platformStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getPlatformStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  };

  systemHealth = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await adminService.getSystemHealth();
      sendSuccess(res, health);
    } catch (err) {
      next(err);
    }
  };

  datasetTemplate = async (_req: Request, res: Response) => {
    const csv = adminService.getDatasetTemplateCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="predixroute-training-template.csv"');
    res.send(csv);
  };

  listTrainingDatasets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const result = await adminService.listTrainingDatasets(page, limit);
      sendPaginated(res, result);
    } catch (err) {
      next(err);
    }
  };

  uploadTrainingDataset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(ApiError.badRequest('NO_FILE', 'CSV file is required'));
      }
      const name = req.body.name || req.file.originalname.replace(/\.csv$/i, '');
      const result = await adminService.uploadTrainingDataset(
        req.user!.userId,
        req.file,
        name,
        req.body.description,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  trainTrainingDataset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.trainTrainingDataset(req.params.datasetId!);
      sendSuccess(res, result, 202);
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
