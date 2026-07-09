import { ApiKeyModel, IApiKey } from '../models/apiKey.model';
import { sha256 } from '../utils/idUtils';

export class ApiKeyRepository {
  async findByHash(keyHash: string): Promise<IApiKey | null> {
    return ApiKeyModel.findOne({ keyHash, status: 'ACTIVE' }).lean() as Promise<IApiKey | null>;
  }

  async findByHashFromRawKey(rawKey: string): Promise<IApiKey | null> {
    return this.findByHash(sha256(rawKey));
  }

  async create(data: Partial<IApiKey>): Promise<IApiKey> {
    const doc = await ApiKeyModel.create(data);
    return doc.toObject();
  }

  async updateLastUsed(id: string): Promise<void> {
    await ApiKeyModel.updateOne({ _id: id }, { lastUsedAt: new Date() });
  }

  async findByOrganization(organizationId: string): Promise<IApiKey[]> {
    return ApiKeyModel.find({ organizationId, status: 'ACTIVE' }).lean() as unknown as Promise<IApiKey[]>;
  }

  async findAllByOrganization(organizationId: string): Promise<IApiKey[]> {
    return ApiKeyModel.find({ organizationId }).sort({ createdAt: -1 }).lean() as unknown as Promise<IApiKey[]>;
  }

  async findByPublicId(organizationId: string, publicId: string): Promise<IApiKey | null> {
    return ApiKeyModel.findOne({
      organizationId,
      publicId,
    }).lean() as Promise<IApiKey | null>;
  }

  async revoke(id: string): Promise<void> {
    await ApiKeyModel.updateOne({ _id: id }, { status: 'REVOKED', revokedAt: new Date() });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
