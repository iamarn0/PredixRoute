import { Schema, model, Document, Types } from 'mongoose';

export interface IPincodePerformance extends Document {
  organizationId: Types.ObjectId;
  pincode: string;
  state: string;
  city: string;
  tier: 'METRO' | 'TIER1' | 'TIER2' | 'TIER3' | 'RURAL';
  period: string;
  metrics: {
    totalShipments: number;
    successRate: number;
    rtoRate: number;
    avgDeliveryDays: number;
    riskScore: number;
    codRiskScore: number;
  };
  courierBreakdown: Array<{
    courierCode: string;
    successRate: number;
    rtoRate: number;
    avgDeliveryDays: number;
    shipmentCount: number;
  }>;
  bestCourier: string | null;
  worstCourier: string | null;
  trend: Array<{ period: string; successRate: number; riskScore: number }>;
  lastComputedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pincodePerformanceSchema = new Schema<IPincodePerformance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    tier: {
      type: String,
      enum: ['METRO', 'TIER1', 'TIER2', 'TIER3', 'RURAL'],
      required: true,
    },
    period: { type: String, default: 'ALL_TIME' },
    metrics: {
      totalShipments: { type: Number, default: 0 },
      successRate: { type: Number, required: true },
      rtoRate: { type: Number, required: true },
      avgDeliveryDays: { type: Number, required: true },
      riskScore: { type: Number, required: true },
      codRiskScore: { type: Number, default: 0 },
    },
    courierBreakdown: { type: [Object], default: [] },
    bestCourier: { type: String, default: null },
    worstCourier: { type: String, default: null },
    trend: { type: [Object], default: [] },
    lastComputedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

pincodePerformanceSchema.index({ organizationId: 1, pincode: 1, period: 1 }, { unique: true });
pincodePerformanceSchema.index({ pincode: 1 });

export const PincodePerformanceModel = model<IPincodePerformance>(
  'PincodePerformance',
  pincodePerformanceSchema,
);
