import { Schema, model, Document } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';

export type WebhookEvent =
  | 'prediction.completed'
  | 'prediction.batch_completed'
  | 'cod.verification.started'
  | 'cod.verification.confirmed'
  | 'cod.verification.rejected'
  | 'cod.verification.expired'
  | 'cod.verification.needs_review';

export interface IWebhook extends Document {
  publicId: string;
  organizationId: Schema.Types.ObjectId;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('wh') },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    url: { type: String, required: true, trim: true },
    secret: { type: String, required: true },
    events: {
      type: [
        {
          type: String,
          enum: [
            'prediction.completed',
            'prediction.batch_completed',
            'cod.verification.started',
            'cod.verification.confirmed',
            'cod.verification.rejected',
            'cod.verification.expired',
            'cod.verification.needs_review',
          ],
        },
      ],
      default: ['prediction.completed'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

webhookSchema.index({ organizationId: 1, isActive: 1 });

export const WebhookModel = model<IWebhook>('Webhook', webhookSchema);
