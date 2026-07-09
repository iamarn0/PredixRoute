import { Schema, model, Document, Types } from 'mongoose';

export interface ICourierPerformance extends Document {
  organizationId: Types.ObjectId;
  courierCode: string;
  courierName: string;
  period: string;
  metrics: {
    totalShipments: number;
    delivered: number;
    rto: number;
    successRate: number;
    rtoRate: number;
    avgDeliveryDays: number;
    p90DeliveryDays: number;
    codSuccessRate: number;
    avgCostPerKg: number;
  };
  trend: Array<{
    period: string;
    successRate: number;
    rtoRate: number;
    avgDeliveryDays: number;
  }>;
  topPincodes: Array<{ pincode: string; successRate: number }>;
  worstPincodes: Array<{ pincode: string; successRate: number }>;
  lastComputedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courierPerformanceSchema = new Schema<ICourierPerformance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    courierCode: { type: String, required: true },
    courierName: { type: String, required: true },
    period: { type: String, default: 'ALL_TIME' },
    metrics: {
      totalShipments: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      rto: { type: Number, default: 0 },
      successRate: { type: Number, required: true },
      rtoRate: { type: Number, required: true },
      avgDeliveryDays: { type: Number, required: true },
      p90DeliveryDays: { type: Number, default: 0 },
      codSuccessRate: { type: Number, default: 0 },
      avgCostPerKg: { type: Number, default: 0 },
    },
    trend: { type: [Object], default: [] },
    topPincodes: { type: [Object], default: [] },
    worstPincodes: { type: [Object], default: [] },
    lastComputedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

courierPerformanceSchema.index({ organizationId: 1, courierCode: 1, period: 1 }, { unique: true });
courierPerformanceSchema.index({ courierCode: 1 });

export const CourierPerformanceModel = model<ICourierPerformance>(
  'CourierPerformance',
  courierPerformanceSchema,
);
