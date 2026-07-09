import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';
import {
  CodVerificationAiIntent,
  CodVerificationMessage,
  CodVerificationStatus,
} from '../types/codVerification.types';
import { RiskLevel } from '../types/prediction.types';

export interface ICodVerification extends Document {
  publicId: string;
  organizationId: Types.ObjectId;
  predictionId?: Types.ObjectId;
  predictionPublicId: string;
  externalRef?: string;
  customerPhone: string;
  customerName: string;
  productName?: string;
  codAmount: number;
  orderValue: number;
  destinationPincode: string;
  status: CodVerificationStatus;
  riskLevelAtStart: RiskLevel;
  turnCount: number;
  maxTurns: number;
  expiresAt: Date;
  lastOutboundMessageSid?: string;
  extractedPincode?: string;
  extractedLandmark?: string;
  messages: CodVerificationMessage[];
  terminalReason?: string;
  confirmedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema(
  {
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
    body: { type: String, required: true },
    aiIntent: {
      type: String,
      enum: ['CONFIRM', 'REJECT', 'FIX_ADDRESS', 'UNCLEAR', 'PREPAID_INTEREST', 'ABUSE'],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const codVerificationSchema = new Schema<ICodVerification>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('cvf') },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    predictionId: { type: Schema.Types.ObjectId, ref: 'Prediction' },
    predictionPublicId: { type: String, default: 'manual' },
    externalRef: { type: String },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    productName: { type: String },
    codAmount: { type: Number, required: true },
    orderValue: { type: Number, required: true },
    destinationPincode: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'IN_PROGRESS', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'NEEDS_REVIEW'],
      default: 'PENDING',
    },
    riskLevelAtStart: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
    turnCount: { type: Number, default: 0 },
    maxTurns: { type: Number, default: 4 },
    expiresAt: { type: Date, required: true },
    lastOutboundMessageSid: { type: String },
    extractedPincode: { type: String },
    extractedLandmark: { type: String },
    messages: { type: [messageSchema], default: [] },
    terminalReason: { type: String },
    confirmedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true },
);

codVerificationSchema.index({ organizationId: 1, createdAt: -1 });
codVerificationSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
codVerificationSchema.index({ organizationId: 1, externalRef: 1, status: 1 });
codVerificationSchema.index({ customerPhone: 1, organizationId: 1, status: 1 });

export const CodVerificationModel = model<ICodVerification>('CodVerification', codVerificationSchema);

export type { CodVerificationAiIntent };
