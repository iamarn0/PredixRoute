import { Request, Response, NextFunction } from 'express';
import { apiKeyRepository } from '../repositories/apiKey.repository';
import { apiUsageService } from '../services/apiUsage.service';
import { ApiError } from '../utils/apiError';
import { ApiKeyScope } from '../models/apiKey.model';

export function apiKeyAuthMiddleware(...requiredScopes: ApiKeyScope[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string | undefined;
      if (!apiKey) {
        throw ApiError.unauthorized('API_KEY_REQUIRED', 'X-API-Key header is required');
      }

      const keyDoc = await apiKeyRepository.findByHashFromRawKey(apiKey);
      if (!keyDoc) {
        throw ApiError.unauthorized('INVALID_API_KEY', 'Invalid or revoked API key');
      }

      if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) {
        throw ApiError.unauthorized('API_KEY_EXPIRED', 'API key has expired');
      }

      for (const scope of requiredScopes) {
        if (!keyDoc.scopes.includes(scope)) {
          throw ApiError.forbidden(`API key missing required scope: ${scope}`);
        }
      }

      await apiUsageService.checkRateLimit(
        keyDoc.organizationId.toString(),
        keyDoc.rateLimitOverride,
      );
      await apiUsageService.checkMonthlyQuota(keyDoc.organizationId.toString());

      req.tenant = { organizationId: keyDoc.organizationId.toString() };
      req.apiKey = {
        _id: keyDoc._id.toString(),
        organizationId: keyDoc.organizationId.toString(),
        scopes: keyDoc.scopes,
        rateLimitOverride: keyDoc.rateLimitOverride,
      };

      await apiKeyRepository.updateLastUsed(keyDoc._id.toString());
      next();
    } catch (err) {
      next(err);
    }
  };
}
