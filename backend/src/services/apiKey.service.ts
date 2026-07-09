import { Types } from 'mongoose';
import { apiKeyRepository } from '../repositories/apiKey.repository';
import { apiPlanRepository } from '../repositories/apiPlan.repository';
import { apiSubscriptionRepository } from '../repositories/apiSubscription.repository';
import { ApiKeyScope } from '../models/apiKey.model';
import { ApiError } from '../utils/apiError';
import { generateApiKey } from '../utils/idUtils';

export interface SafeApiKey {
  publicId: string;
  name: string;
  keyPrefix: string;
  environment: 'LIVE' | 'TEST';
  scopes: ApiKeyScope[];
  status: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export class ApiKeyService {
  async listKeys(organizationId: string): Promise<SafeApiKey[]> {
    const keys = await apiKeyRepository.findAllByOrganization(organizationId);
    return keys.map((k) => this.sanitizeKey(k));
  }

  async createKey(
    organizationId: string,
    userId: string,
    input: { name: string; environment: 'LIVE' | 'TEST'; scopes?: ApiKeyScope[] },
  ) {
    const subscription = await apiSubscriptionRepository.findByOrganization(organizationId);
    const plan = subscription
      ? await apiPlanRepository.findById(subscription.planId.toString())
      : null;

    const allowedScopes = (plan?.allowedScopes ?? ['risk:evaluate']) as ApiKeyScope[];
    const requestedScopes = input.scopes?.length
      ? input.scopes.filter((s) => allowedScopes.includes(s))
      : allowedScopes;

    if (requestedScopes.length === 0) {
      throw ApiError.badRequest('INVALID_SCOPES', 'No valid scopes for your plan');
    }

    const { key, hash, prefix } = generateApiKey(input.environment);

    const apiKey = await apiKeyRepository.create({
      organizationId: new Types.ObjectId(organizationId),
      name: input.name,
      keyPrefix: prefix,
      keyHash: hash,
      environment: input.environment,
      scopes: requestedScopes,
      status: 'ACTIVE',
      createdBy: new Types.ObjectId(userId),
    });

    return {
      ...this.sanitizeKey(apiKey),
      key,
      message: 'Store this key securely. It will not be shown again.',
    };
  }

  async revokeKey(organizationId: string, publicId: string): Promise<void> {
    const key = await apiKeyRepository.findByPublicId(organizationId, publicId);
    if (!key) {
      throw ApiError.notFound('API key');
    }

    if (key.status === 'REVOKED') {
      throw ApiError.badRequest('ALREADY_REVOKED', 'API key is already revoked');
    }

    await apiKeyRepository.revoke(key._id.toString());
  }

  private sanitizeKey(key: {
    publicId: string;
    name: string;
    keyPrefix: string;
    environment: 'LIVE' | 'TEST';
    scopes: ApiKeyScope[];
    status: string;
    lastUsedAt: Date | null;
    createdAt: Date;
  }): SafeApiKey {
    return {
      publicId: key.publicId,
      name: key.name,
      keyPrefix: key.keyPrefix,
      environment: key.environment,
      scopes: key.scopes,
      status: key.status,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    };
  }
}

export const apiKeyService = new ApiKeyService();
