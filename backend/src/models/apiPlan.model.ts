import { Schema, model, Document } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';

export interface IApiPlan extends Document {
  publicId: string;
  name: string;
  slug: string;
  priceMonthlyINR: number;
  limits: {
    apiCallsPerMonth: number;
    predictionsPerDay: number;
    batchSizeMax: number;
    rateLimitPerMinute: number;
  };
  allowedScopes: string[];
  isActive: boolean;
  sortOrder: number;
}

const apiPlanSchema = new Schema<IApiPlan>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('org') },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    priceMonthlyINR: { type: Number, required: true },
    limits: {
      apiCallsPerMonth: { type: Number, required: true },
      predictionsPerDay: { type: Number, required: true },
      batchSizeMax: { type: Number, required: true },
      rateLimitPerMinute: { type: Number, required: true },
    },
    allowedScopes: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const ApiPlanModel = model<IApiPlan>('ApiPlan', apiPlanSchema);
