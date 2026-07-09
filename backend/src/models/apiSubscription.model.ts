import { Schema, model, Document, Types } from 'mongoose';

export interface IApiSubscription extends Document {
  organizationId: Types.ObjectId;
  planId: Types.ObjectId;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
}

const apiSubscriptionSchema = new Schema<IApiSubscription>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: 'ApiPlan', required: true },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
      default: 'TRIAL',
    },
    billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    trialEndsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ApiSubscriptionModel = model<IApiSubscription>('ApiSubscription', apiSubscriptionSchema);
