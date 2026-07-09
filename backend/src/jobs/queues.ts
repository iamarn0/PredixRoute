import { Queue } from 'bullmq';
import { config } from '../config';

const connection = { url: config.redisUrl };

export const emailQueue = new Queue('email', { connection });
export const webhookQueue = new Queue('webhook', { connection });

export type EmailQueueJob = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export const messagingQueue = new Queue('messaging', { connection });

export type MessagingQueueJob =
  | { type: 'send_opening'; verificationPublicId: string; organizationId: string }
  | { type: 'send_reply'; verificationPublicId: string; organizationId: string; body: string }
  | { type: 'expire_session'; verificationPublicId: string; organizationId: string };

export const bulkPredictionQueue = new Queue('bulk-prediction', { connection });

export type BulkPredictionQueueJob = {
  jobId: string;
  organizationId: string;
  publicId: string;
};

export const trainingDataSyncQueue = new Queue('training-data-sync', { connection });

export type TrainingDataSyncQueueJob =
  | { type: 'sync_all' }
  | { type: 'sync_org'; organizationId: string };

export type WebhookQueueJob = {
  webhookId: string;
  organizationId: string;
  url: string;
  secret: string;
  event: string;
  payload: Record<string, unknown>;
};
