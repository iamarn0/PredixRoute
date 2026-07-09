import twilio from 'twilio';
import { config, isTwilioConfigured } from '../../config';
import logger from '../../utils/logger';

export class TwilioWhatsAppProvider {
  private client: ReturnType<typeof twilio> | null = null;

  private getClient() {
    if (!isTwilioConfigured()) return null;
    if (!this.client) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
    return this.client;
  }

  isConfigured(): boolean {
    return isTwilioConfigured();
  }

  async sendOpeningTemplate(
    toPhone: string,
    variables: { customerName: string; externalRef: string; codAmount: string },
  ): Promise<{ messageSid: string; mode: 'template' | 'session' }> {
    const client = this.getClient();
    if (!client) {
      logger.info(`[twilio:dev] Opening to ${toPhone}: ${JSON.stringify(variables)}`);
      return { messageSid: `dev_${Date.now()}`, mode: 'session' };
    }

    const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    const from = config.twilio.whatsappFrom.startsWith('whatsapp:')
      ? config.twilio.whatsappFrom
      : `whatsapp:${config.twilio.whatsappFrom}`;

    if (config.twilio.whatsappTemplateSid) {
      const message = await client.messages.create({
        from,
        to,
        contentSid: config.twilio.whatsappTemplateSid,
        contentVariables: JSON.stringify({
          '1': variables.customerName,
          '2': variables.externalRef,
          '3': variables.codAmount,
        }),
      });
      return { messageSid: message.sid, mode: 'template' };
    }

    const body = `Hi ${variables.customerName}, please confirm your COD order ${variables.externalRef} for ₹${variables.codAmount}. Reply YES to confirm, NO to cancel, or tell us if your delivery address needs correction.`;
    const message = await client.messages.create({ from, to, body });
    return { messageSid: message.sid, mode: 'session' };
  }

  async sendSessionMessage(toPhone: string, body: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      logger.info(`[twilio:dev] Reply to ${toPhone}: ${body}`);
      return `dev_${Date.now()}`;
    }

    const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    const from = config.twilio.whatsappFrom.startsWith('whatsapp:')
      ? config.twilio.whatsappFrom
      : `whatsapp:${config.twilio.whatsappFrom}`;

    const message = await client.messages.create({ from, to, body });
    return message.sid;
  }

  validateWebhookSignature(url: string, params: Record<string, string>, signature: string): boolean {
    if (!isTwilioConfigured()) return config.env === 'development';
    return twilio.validateRequest(config.twilio.authToken, signature, url, params);
  }
}

export const twilioWhatsAppProvider = new TwilioWhatsAppProvider();
