import { organizationRepository } from '../repositories/organization.repository';
import { ApiError } from '../utils/apiError';
import { CodVerificationSettings } from '../types/codVerification.types';
import { TrainingDataSettings } from '../models/organization.model';
import { trainingDataSyncQueue } from '../jobs/queues';

const DEFAULT_TRAINING_DATA: TrainingDataSettings = {
  allowTrainingDataUse: false,
  trainingConsentAt: null,
  trainingConsentBy: null,
  webhookSyncUrl: null,
  webhookSyncSecret: null,
  lastSyncAt: null,
};

export class SettingsService {
  async getOrganization(organizationId: string) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization');
    return {
      publicId: org.publicId,
      name: org.name,
      slug: org.slug,
      industry: org.industry,
      status: org.status,
      billingEmail: org.billingEmail,
      settings: {
        timezone: org.settings?.timezone ?? 'Asia/Kolkata',
        defaultCurrency: org.settings?.defaultCurrency ?? 'INR',
        dataRetentionDays: org.settings?.dataRetentionDays ?? 365,
        codVerification: {
          enabled: org.settings?.codVerification?.enabled ?? true,
          riskLevels: org.settings?.codVerification?.riskLevels ?? ['MEDIUM', 'HIGH', 'CRITICAL'],
          expiryHours: org.settings?.codVerification?.expiryHours ?? 24,
          maxTurns: org.settings?.codVerification?.maxTurns ?? 4,
        },
        trainingData: {
          ...DEFAULT_TRAINING_DATA,
          ...(org.settings?.trainingData ?? {}),
        },
      },
    };
  }

  async updateOrganization(
    organizationId: string,
    updates: {
      name?: string;
      billingEmail?: string;
      settings?: Partial<{
        timezone: string;
        defaultCurrency: string;
        dataRetentionDays: number;
        codVerification: Partial<CodVerificationSettings>;
        trainingData: Partial<TrainingDataSettings>;
      }>;
    },
    userId?: string,
  ) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization');

    const trainingUpdates = updates.settings?.trainingData;
    if (trainingUpdates?.allowTrainingDataUse === true) {
      if (!trainingUpdates.trainingConsentAt && userId) {
        trainingUpdates.trainingConsentAt = new Date();
        trainingUpdates.trainingConsentBy = userId;
      }
    }
    if (trainingUpdates?.allowTrainingDataUse === false) {
      trainingUpdates.webhookSyncUrl = null;
      trainingUpdates.webhookSyncSecret = null;
    }

    const merged = await organizationRepository.updateProfile(
      organizationId,
      updates as Parameters<typeof organizationRepository.updateProfile>[1],
    );
    if (!merged) throw ApiError.notFound('Organization');

    if (
      trainingUpdates?.allowTrainingDataUse &&
      (trainingUpdates.webhookSyncUrl || merged.settings?.trainingData?.webhookSyncUrl)
    ) {
      void trainingDataSyncQueue
        .add('sync-org', { type: 'sync_org', organizationId })
        .catch(() => {});
    }

    return {
      publicId: merged.publicId,
      name: merged.name,
      billingEmail: merged.billingEmail,
      settings: merged.settings,
    };
  }

  async updateTrainingConsent(
    organizationId: string,
    userId: string,
    payload: {
      allowTrainingDataUse: boolean;
      termsAccepted?: boolean;
      webhookSyncUrl?: string | null;
      webhookSyncSecret?: string | null;
    },
  ) {
    if (payload.allowTrainingDataUse && !payload.termsAccepted) {
      throw ApiError.badRequest('TERMS_REQUIRED', 'You must accept the data sharing terms');
    }

    return this.updateOrganization(
      organizationId,
      {
        settings: {
          trainingData: {
            allowTrainingDataUse: payload.allowTrainingDataUse,
            trainingConsentAt: payload.allowTrainingDataUse ? new Date() : null,
            trainingConsentBy: payload.allowTrainingDataUse ? userId : null,
            webhookSyncUrl: payload.webhookSyncUrl ?? null,
            webhookSyncSecret: payload.webhookSyncSecret ?? null,
            lastSyncAt: null,
          },
        },
      },
      userId,
    );
  }
}

export const settingsService = new SettingsService();
