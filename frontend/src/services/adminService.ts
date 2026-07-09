import { apiClient } from './apiClient';
import { ApiSuccessResponse, PaginationMeta } from '../types/api.types';
import { DatasetRecord } from './datasetService';

export const adminService = {
  async getStats() {
    const { data } = await apiClient.get<ApiSuccessResponse<import('../types/api.types').AdminStats>>('/admin/stats');
    return data.data;
  },

  async listOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<import('../types/api.types').AdminOrganization[]> & { meta?: { pagination: PaginationMeta } }
    >('/admin/organizations', { params });
    return { organizations: data.data, pagination: data.meta?.pagination };
  },

  async getOrganization(publicId: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<import('../types/api.types').AdminOrganizationDetail>>(
      `/admin/organizations/${publicId}`,
    );
    return data.data;
  },

  async updateOrganizationStatus(publicId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED') {
    const { data } = await apiClient.patch(`/admin/organizations/${publicId}/status`, { status });
    return data.data;
  },

  async listUsers(params: { page?: number; limit?: number; search?: string } = {}) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<import('../types/api.types').AdminUser[]> & { meta?: { pagination: PaginationMeta } }
    >('/admin/users', { params });
    return { users: data.data, pagination: data.meta?.pagination };
  },

  async getSystemHealth() {
    const { data } = await apiClient.get<ApiSuccessResponse<import('../types/api.types').SystemHealth>>('/admin/system/health');
    return data.data;
  },

  async listTrainingDatasets(page = 1) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<DatasetRecord[]> & { meta?: { pagination: PaginationMeta } }
    >('/admin/datasets', { params: { page, limit: 20 } });
    return { datasets: data.data, pagination: data.meta?.pagination };
  },

  async uploadTrainingDataset(file: File, name: string, description?: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    if (description) form.append('description', description);
    const { data } = await apiClient.post<ApiSuccessResponse<{ publicId: string; status: string; message: string }>>(
      '/admin/datasets/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async trainDataset(datasetPublicId: string) {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ message: string; status: string; trainingMetrics: DatasetRecord['trainingMetrics'] }>
    >(`/admin/datasets/${datasetPublicId}/train`);
    return data.data;
  },

  async downloadDatasetTemplate() {
    const response = await apiClient.get('/admin/datasets/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'predixroute-training-template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async listTrainingContributions(page = 1) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<import('./trainingContributionService').TrainingContribution[]> & {
        meta?: { pagination: PaginationMeta };
      }
    >('/admin/training-contributions', { params: { page, limit: 20 } });
    return { contributions: data.data, pagination: data.meta?.pagination };
  },

  async approveContribution(id: string, notes?: string) {
    const { data } = await apiClient.post(`/admin/training-contributions/${id}/approve`, { notes });
    return data.data;
  },

  async rejectContribution(id: string, notes?: string) {
    const { data } = await apiClient.post(`/admin/training-contributions/${id}/reject`, { notes });
    return data.data;
  },

  async mergeContribution(id: string) {
    const { data } = await apiClient.post(`/admin/training-contributions/${id}/merge`);
    return data.data;
  },
};
