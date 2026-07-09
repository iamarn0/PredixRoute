import { Worker } from 'bullmq';
import { config } from '../../config';
import { bulkPredictionService } from '../../services/bulkPrediction.service';
import logger from '../../utils/logger';

export function startBulkPredictionWorker() {
  const worker = new Worker(
    'bulk-prediction',
    async (job) => {
      const data = job.data as { jobId: string; organizationId: string; publicId: string };
      await bulkPredictionService.processJob(data.jobId, data.organizationId, data.publicId);
    },
    { connection: { url: config.redisUrl }, concurrency: 2 },
  );

  worker.on('failed', (job, err) => {
    logger.warn(`Bulk prediction job ${job?.id} failed: ${String(err)}`);
  });

  return worker;
}
