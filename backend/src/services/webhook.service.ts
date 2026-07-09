import { webhookRepository, maskSecret, validateWebhookUrl } from '../repositories/webhook.repository';
import { webhookQueue } from '../jobs/queues';
import { WebhookEvent } from '../models/webhook.model';
import { ApiError } from '../utils/apiError';

export class WebhookService {
  async list(organizationId: string) {
    const hooks = await webhookRepository.listByOrganization(organizationId);
    return hooks.map((h) => ({
      publicId: h.publicId,
      url: h.url,
      events: h.events,
      isActive: h.isActive,
      secretPreview: maskSecret(h.secret),
      createdAt: h.createdAt,
    }));
  }

  async create(organizationId: string, url: string, events: WebhookEvent[]) {
    validateWebhookUrl(url);
    const hook = await webhookRepository.create(organizationId, url, events);
    return {
      publicId: hook.publicId,
      url: hook.url,
      events: hook.events,
      secret: hook.secret,
      message: 'Store the secret securely — it will not be shown again.',
    };
  }

  async remove(organizationId: string, publicId: string) {
    const deleted = await webhookRepository.delete(organizationId, publicId);
    if (!deleted) throw ApiError.notFound('Webhook');
    return { message: 'Webhook deleted' };
  }

  async dispatch(organizationId: string, event: WebhookEvent, payload: Record<string, unknown>) {
    const hooks = await webhookRepository.findActiveForEvent(organizationId, event);
    await Promise.all(
      hooks.map((hook) =>
        webhookQueue.add(
          'deliver',
          {
            webhookId: hook.publicId,
            organizationId,
            url: hook.url,
            secret: hook.secret,
            event,
            payload,
          },
          { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
        ),
      ),
    );
  }
}

export const webhookService = new WebhookService();
