import { Worker } from 'bullmq';
import { config } from '../../config';
import { trainingDataSyncService } from '../../services/trainingDataSync.service';
import { OrganizationModel } from '../../models/organization.model';
import logger from '../../utils/logger';

export function startTrainingDataSyncWorker() {
  const worker = new Worker(
    'training-data-sync',
    async (job) => {
      const data = job.data as { type: string; organizationId?: string };

      if (data.type === 'sync_all') {
        await trainingDataSyncService.syncAllConsentedOrganizations();
        return;
      }

      if (data.type === 'sync_org' && data.organizationId) {
        const org = await OrganizationModel.findById(data.organizationId).lean();
        const url = org?.settings?.trainingData?.webhookSyncUrl;
        if (!url || !org?.settings?.trainingData?.allowTrainingDataUse) {
          throw new Error('Organization not configured for training sync');
        }
        await trainingDataSyncService.syncOrganization(
          data.organizationId,
          url,
          org.settings.trainingData.webhookSyncSecret,
        );
      }
    },
    { connection: { url: config.redisUrl }, concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.warn(`Training sync job ${job?.id} failed: ${String(err)}`);
  });

  return worker;
}

export async function scheduleTrainingSyncJobs() {
  const { trainingDataSyncQueue } = await import('../queues.js');
  await trainingDataSyncQueue.add(
    'nightly-sync',
    { type: 'sync_all' },
    { repeat: { pattern: '0 2 * * *' } },
  );
}
