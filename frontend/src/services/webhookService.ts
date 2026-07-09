import { apiClient } from './apiClient';
import { ApiSuccessResponse } from '../types/api.types';

export type Webhook = {
  publicId: string;
  url: string;
  events: string[];
  isActive: boolean;
  secretPreview: string;
  createdAt: string;
};

export const webhookService = {
  async list() {
    const { data } = await apiClient.get<ApiSuccessResponse<{ data: Webhook[] }>>('/dashboard/webhooks');
    return data.data.data;
  },

  async create(url: string, events: string[]) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ publicId: string; secret: string; message: string }>>(
      '/dashboard/webhooks',
      { url, events },
    );
    return data.data;
  },

  async remove(publicId: string) {
    await apiClient.delete(`/dashboard/webhooks/${publicId}`);
  },
};
