import { Router } from 'express';
import express from 'express';
import { twilioWebhookController } from '../controllers/webhooks/twilioWebhook.controller';

const router = Router();

router.post(
  '/twilio/whatsapp',
  express.urlencoded({ extended: false }),
  twilioWebhookController.whatsappInbound,
);

export default router;
