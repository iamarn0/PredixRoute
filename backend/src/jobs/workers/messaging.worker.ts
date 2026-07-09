import { Worker } from 'bullmq';
import { config } from '../../config';
import { codVerificationService } from '../../services/codVerification.service';
import logger from '../../utils/logger';

export function startMessagingWorker() {
  const worker = new Worker(
    'messaging',
    async (job) => {
      const data = job.data as {
        verificationPublicId: string;
        organizationId: string;
        body?: string;
      };

      switch (job.name) {
        case 'send_opening':
          await codVerificationService.sendOpening(data.verificationPublicId, data.organizationId);
          break;
        case 'send_reply':
          if (!data.body) throw new Error('body required for send_reply');
          await codVerificationService.sendReply(
            data.verificationPublicId,
            data.organizationId,
            data.body,
          );
          break;
        case 'expire_session':
          await codVerificationService.expireSession(data.verificationPublicId, data.organizationId);
          break;
        default:
          logger.warn(`Unknown messaging job: ${job.name}`);
      }
    },
    { connection: { url: config.redisUrl }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.warn(`Messaging job ${job?.id} failed: ${String(err)}`);
  });

  return worker;
}
