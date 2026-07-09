import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getRedis } from '../config/redis';
import { verifyAccessToken } from '../utils/tokenUtils';
import { ApiError } from '../utils/apiError';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.prx_access ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      throw ApiError.unauthorized();
    }

    const payload = verifyAccessToken(token);
    const redis = getRedis();
    const revoked = await redis.get(`revoked:${payload.jti}`);
    if (revoked) {
      throw ApiError.unauthorized('TOKEN_REVOKED', 'Token has been revoked');
    }

    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      email: payload.email,
      publicId: payload.sub,
      jti: payload.jti,
    };
    req.tenant = { organizationId: payload.organizationId };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('TOKEN_EXPIRED', 'Access token expired'));
    }
    return next(ApiError.unauthorized('INVALID_TOKEN', 'Invalid access token'));
  }
}

export function rbacMiddleware(...allowedRoles: Array<'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'ANALYST'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
