import crypto from 'crypto';
import axios from 'axios';
import { Worker } from 'bullmq';
import { config } from '../../config';
import logger from '../../utils/logger';

function signPayload(secret: string, body: string, timestamp: number) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function startWebhookWorker() {
  const worker = new Worker(
    'webhook',
    async (job) => {
      const { url, secret, event, payload } = job.data;
      const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
      const timestamp = Date.now();
      const signature = signPayload(secret, body, timestamp);

      await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-PredixRoute-Event': event,
          'X-PredixRoute-Signature': signature,
          'X-PredixRoute-Timestamp': String(timestamp),
        },
        timeout: 10000,
        validateStatus: (s) => s >= 200 && s < 300,
      });
    },
    { connection: { url: config.redisUrl }, concurrency: 10 },
  );

  worker.on('failed', (job, err) => {
    logger.warn(`Webhook job ${job?.id} failed: ${String(err)}`);
  });

  return worker;
}
