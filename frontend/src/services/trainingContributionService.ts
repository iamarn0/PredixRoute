import { apiClient } from './apiClient';
import { ApiSuccessResponse, PaginationMeta } from '../types/api.types';

export type TrainingContribution = {
  publicId: string;
  name: string;
  description: string;
  source: string;
  status: string;
  originalFileName: string | null;
  rowCount: number;
  qualityScore: number;
  qualityIssues: Array<{ severity: string; message: string; column?: string }>;
  reviewNotes: string | null;
  errorMessage: string | null;
  createdAt: string;
  organizationId?: string;
};

export const trainingContributionService = {
  async list(page = 1) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<TrainingContribution[]> & { meta?: { pagination: PaginationMeta } }
    >('/dashboard/datasets/training-contributions', { params: { page, limit: 20 } });
    return { contributions: data.data, pagination: data.meta?.pagination };
  },

  async upload(file: File, name: string, description?: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    if (description) form.append('description', description);
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ publicId: string; status: string; message: string }>
    >('/dashboard/datasets/training-contributions', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async updateConsent(payload: {
    allowTrainingDataUse: boolean;
    termsAccepted?: boolean;
    webhookSyncUrl?: string | null;
    webhookSyncSecret?: string | null;
  }) {
    const { data } = await apiClient.post('/dashboard/settings/training-consent', payload);
    return data.data;
  },

  async triggerSync() {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>('/dashboard/settings/training-sync');
    return data.data;
  },
};
