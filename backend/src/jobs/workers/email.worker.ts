import { Worker } from 'bullmq';
import { config } from '../../config';
import { emailService } from '../../services/email.service';
import logger from '../../utils/logger';

export function startEmailWorker() {
  const worker = new Worker(
    'email',
    async (job) => {
      await emailService.send(job.data);
    },
    { connection: { url: config.redisUrl }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${String(err)}`);
  });

  return worker;
}
