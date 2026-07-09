import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { codVerificationService } from '../../services/codVerification.service';
import { twilioWhatsAppProvider } from '../../services/messaging/twilioWhatsApp.provider';
import { normalizeWhatsAppPhone } from '../../utils/phoneUtils';
import { ApiError } from '../../utils/apiError';

export class TwilioWebhookController {
  whatsappInbound = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-twilio-signature'] as string | undefined;
      const webhookUrl = `${config.twilio.webhookBaseUrl}/api/v1/webhooks/twilio/whatsapp`;
      const params = req.body as Record<string, string>;

      if (
        signature &&
        !twilioWhatsAppProvider.validateWebhookSignature(webhookUrl, params, signature)
      ) {
        throw ApiError.unauthorized('INVALID_TWILIO_SIGNATURE', 'Invalid Twilio signature');
      }

      const from = params.From;
      const body = params.Body?.trim();

      if (from && body) {
        const phone = normalizeWhatsAppPhone(from);
        void codVerificationService.handleInbound(phone, body).catch(() => {});
      }

      res.type('text/xml');
      res.send('<Response></Response>');
    } catch (err) {
      next(err);
    }
  };
}

export const twilioWebhookController = new TwilioWebhookController();
