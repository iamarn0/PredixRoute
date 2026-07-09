import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';

export type ApiKeyScope =
  | 'risk:evaluate'
  | 'recommendation'
  | 'batch'
  | 'pincode:read'
  | 'courier:read'
  | 'cod:verify';

export interface IApiKey extends Document {
  organizationId: Types.ObjectId;
  publicId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  environment: 'LIVE' | 'TEST';
  scopes: ApiKeyScope[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  rateLimitOverride: number | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('key') },
    name: { type: String, required: true, trim: true },
    keyPrefix: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    environment: { type: String, enum: ['LIVE', 'TEST'], required: true },
    scopes: [{ type: String }],
    status: { type: String, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], default: 'ACTIVE' },
    rateLimitOverride: { type: Number, default: null },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

apiKeySchema.index({ organizationId: 1, status: 1 });
apiKeySchema.index({ keyHash: 1 }, { unique: true });

export const ApiKeyModel = model<IApiKey>('ApiKey', apiKeySchema);
