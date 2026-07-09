import { WebhookModel, IWebhook, WebhookEvent } from '../models/webhook.model';
import { generateToken } from '../utils/idUtils';
import { ApiError } from '../utils/apiError';

export class WebhookRepository {
  async create(organizationId: string, url: string, events: WebhookEvent[]): Promise<IWebhook> {
    const doc = await WebhookModel.create({
      organizationId,
      url,
      events,
      secret: generateToken(),
    });
    return doc.toObject();
  }

  async listByOrganization(organizationId: string) {
    return WebhookModel.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  async findByPublicId(organizationId: string, publicId: string) {
    return WebhookModel.findOne({ organizationId, publicId }).lean();
  }

  async delete(organizationId: string, publicId: string): Promise<boolean> {
    const result = await WebhookModel.deleteOne({ organizationId, publicId });
    return result.deletedCount > 0;
  }

  async findActiveForEvent(organizationId: string, event: WebhookEvent) {
    return WebhookModel.find({ organizationId, isActive: true, events: event }).lean();
  }
}

export const webhookRepository = new WebhookRepository();

export function maskSecret(secret: string) {
  return `${secret.slice(0, 4)}${'*'.repeat(Math.max(0, secret.length - 8))}${secret.slice(-4)}`;
}

export function validateWebhookUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw ApiError.badRequest('INVALID_WEBHOOK_URL', 'Webhook URL must use HTTP or HTTPS');
    }
    if (configIsLocalhost(parsed.hostname) && process.env.NODE_ENV === 'production') {
      throw ApiError.badRequest('INVALID_WEBHOOK_URL', 'Localhost webhooks are not allowed in production');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest('INVALID_WEBHOOK_URL', 'Invalid webhook URL');
  }
}

function configIsLocalhost(host: string) {
  return host === 'localhost' || host === '127.0.0.1';
}
