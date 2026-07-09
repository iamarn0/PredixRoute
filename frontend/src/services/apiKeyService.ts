import { apiClient } from './apiClient';
import { ApiKeyItem, ApiSuccessResponse } from '../types/api.types';

export const apiKeyService = {
  async list() {
    const { data } = await apiClient.get<ApiSuccessResponse<ApiKeyItem[]>>('/dashboard/api-keys');
    return data.data;
  },

  async create(payload: { name: string; environment: 'LIVE' | 'TEST'; scopes?: string[] }) {
    const { data } = await apiClient.post<
      ApiSuccessResponse<ApiKeyItem & { key: string; message: string }>
    >('/dashboard/api-keys', payload);
    return data.data;
  },

  async revoke(publicId: string) {
    await apiClient.delete(`/dashboard/api-keys/${publicId}`);
  },
};
