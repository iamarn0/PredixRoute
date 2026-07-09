import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import logger from '../utils/logger';
import { startEmailWorker } from './workers/email.worker';
import { startWebhookWorker } from './workers/webhook.worker';
import { startMessagingWorker } from './workers/messaging.worker';
import { startBulkPredictionWorker } from './workers/bulkPrediction.worker';
import { startTrainingDataSyncWorker, scheduleTrainingSyncJobs } from './workers/trainingDataSync.worker';

dotenv.config();

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const emailWorker = startEmailWorker();
  const webhookWorker = startWebhookWorker();
  const messagingWorker = startMessagingWorker();
  const bulkPredictionWorker = startBulkPredictionWorker();
  const trainingDataSyncWorker = startTrainingDataSyncWorker();

  await scheduleTrainingSyncJobs().catch((err) => {
    logger.warn(`Could not schedule training sync jobs: ${String(err)}`);
  });

  logger.info('PredixRoute background workers started');

  const shutdown = async (signal: string) => {
    logger.info(`Worker received ${signal}. Shutting down…`);
    await emailWorker.close();
    await webhookWorker.close();
    await messagingWorker.close();
    await bulkPredictionWorker.close();
    await trainingDataSyncWorker.close();
    await disconnectRedis();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Worker failed to start: ${String(err)}`);
  process.exit(1);
});
