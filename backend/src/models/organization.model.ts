import { Schema, model, Document } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';
import { CodVerificationSettings } from '../types/codVerification.types';

export interface TrainingDataSettings {
  allowTrainingDataUse: boolean;
  trainingConsentAt: Date | null;
  trainingConsentBy: string | null;
  webhookSyncUrl: string | null;
  webhookSyncSecret: string | null;
  lastSyncAt: Date | null;
}

export interface IOrganization extends Document {
  publicId: string;
  name: string;
  slug: string;
  industry: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  billingEmail: string;
  settings: {
    timezone: string;
    defaultCurrency: string;
    dataRetentionDays: number;
    codVerification: CodVerificationSettings;
    trainingData: TrainingDataSettings;
  };
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('org') },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    industry: {
      type: String,
      enum: ['LOGISTICS', 'ECOMMERCE', 'AGGREGATOR', 'COURIER', 'OMS', 'OTHER'],
      default: 'LOGISTICS',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'],
      default: 'ACTIVE',
    },
    billingEmail: { type: String, required: true, lowercase: true, trim: true },
    settings: {
      timezone: { type: String, default: 'Asia/Kolkata' },
      defaultCurrency: { type: String, default: 'INR' },
      dataRetentionDays: { type: Number, default: 365 },
      codVerification: {
        enabled: { type: Boolean, default: true },
        riskLevels: {
          type: [{ type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }],
          default: ['MEDIUM', 'HIGH', 'CRITICAL'],
        },
        expiryHours: { type: Number, default: 24 },
        maxTurns: { type: Number, default: 4 },
      },
      trainingData: {
        allowTrainingDataUse: { type: Boolean, default: false },
        trainingConsentAt: { type: Date, default: null },
        trainingConsentBy: { type: String, default: null },
        webhookSyncUrl: { type: String, default: null },
        webhookSyncSecret: { type: String, default: null },
        lastSyncAt: { type: Date, default: null },
      },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ status: 1, createdAt: -1 });

export const OrganizationModel = model<IOrganization>('Organization', organizationSchema);
