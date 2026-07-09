import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';
import { PredictionSource, RiskLevel } from '../types/prediction.types';
import { AddressAnalysis } from '../types/address.types';

export interface IPrediction extends Document {
  organizationId: Types.ObjectId;
  publicId: string;
  input: {
    destinationPincode: string;
    deliveryAddress?: string;
    weightGrams: number;
    cod: boolean;
    codAmount: number | null;
    orderValue: number;
    addressQualityScore: number;
    addressAnalysis?: AddressAnalysis;
    availableCouriers: string[];
    externalRef?: string;
    customerPhone?: string;
    customerName?: string;
    productName?: string;
  };
  output: {
    deliveryProbability: number;
    riskScore: number;
    riskLevel: RiskLevel;
    recommendedCourier: string;
    courierRankings: unknown[];
  };
  explanations: unknown[];
  modelVersion: string;
  source: PredictionSource;
  apiKeyId: Types.ObjectId | null;
  apiEndpoint: string | null;
  operationalLogOnly: boolean;
  latencyMs: number;
  createdAt: Date;
}

const predictionSchema = new Schema<IPrediction>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('prd') },
    input: {
      destinationPincode: { type: String, required: true },
      deliveryAddress: { type: String },
      weightGrams: { type: Number, required: true },
      cod: { type: Boolean, required: true },
      codAmount: { type: Number, default: null },
      orderValue: { type: Number, required: true },
      addressQualityScore: { type: Number, required: true },
      addressAnalysis: { type: Schema.Types.Mixed },
      availableCouriers: [{ type: String }],
      externalRef: { type: String },
      customerPhone: { type: String },
      customerName: { type: String },
      productName: { type: String },
    },
    output: {
      deliveryProbability: { type: Number, required: true },
      riskScore: { type: Number, required: true },
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
      recommendedCourier: { type: String, required: true },
      courierRankings: { type: [Object], default: [] },
    },
    explanations: { type: [Object], default: [] },
    modelVersion: { type: String, required: true },
    source: { type: String, enum: ['DASHBOARD', 'PUBLIC_API', 'BATCH', 'DEMO'], required: true },
    apiKeyId: { type: Schema.Types.ObjectId, ref: 'ApiKey', default: null },
    apiEndpoint: { type: String, default: null },
    operationalLogOnly: { type: Boolean, default: true },
    latencyMs: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

predictionSchema.index({ organizationId: 1, createdAt: -1 });
predictionSchema.index({ organizationId: 1, 'output.riskLevel': 1, createdAt: -1 });

export const PredictionModel = model<IPrediction>('Prediction', predictionSchema);
