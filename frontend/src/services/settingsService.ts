import { apiClient } from './apiClient';
import { ApiSuccessResponse } from '../types/api.types';

export type OrganizationSettings = {
  publicId: string;
  name: string;
  slug: string;
  industry: string;
  status: string;
  billingEmail: string;
  settings: {
    timezone: string;
    defaultCurrency: string;
    dataRetentionDays: number;
    codVerification: {
      enabled: boolean;
      riskLevels: string[];
      expiryHours: number;
      maxTurns: number;
    };
    trainingData: {
      allowTrainingDataUse: boolean;
      trainingConsentAt: string | null;
      trainingConsentBy: string | null;
      webhookSyncUrl: string | null;
      webhookSyncSecret: string | null;
      lastSyncAt: string | null;
    };
  };
};

export const settingsService = {
  async getOrganization() {
    const { data } = await apiClient.get<ApiSuccessResponse<OrganizationSettings>>('/dashboard/settings/organization');
    return data.data;
  },

  async updateOrganization(payload: {
    name?: string;
    billingEmail?: string;
    settings?: Partial<OrganizationSettings['settings']> & {
      codVerification?: Partial<OrganizationSettings['settings']['codVerification']>;
    };
  }) {
    const { data } = await apiClient.patch('/dashboard/settings/organization', payload);
    return data.data;
  },
};
