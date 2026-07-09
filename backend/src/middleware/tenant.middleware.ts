import { Request, Response, NextFunction } from 'express';
import { organizationRepository } from '../repositories/organization.repository';
import { ApiError } from '../utils/apiError';

export async function tenantStatusMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const organizationId = req.tenant?.organizationId ?? req.user?.organizationId;
    if (!organizationId) return next();

    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      return next(new ApiError(403, 'ORG_NOT_FOUND', 'Organization not found'));
    }
    if (org.status === 'SUSPENDED') {
      return next(new ApiError(403, 'ORG_SUSPENDED', 'Your organization has been suspended. Contact support.'));
    }
    if (org.status === 'DELETED' || org.deletedAt) {
      return next(new ApiError(403, 'ORG_INACTIVE', 'Organization is no longer active'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
