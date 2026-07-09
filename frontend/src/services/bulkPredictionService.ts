import { apiClient } from './apiClient';
import { ApiSuccessResponse, PaginationMeta } from '../types/api.types';

export type BulkPredictionJob = {
  publicId: string;
  name: string;
  status: string;
  originalFileName: string;
  totalRows: number;
  processedRows: number;
  progressPercent: number;
  availableCouriers: string[];
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
};

export const bulkPredictionService = {
  async list(page = 1) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<BulkPredictionJob[]> & { meta?: { pagination: PaginationMeta } }
    >('/dashboard/bulk-predictions', { params: { page, limit: 20 } });
    return { jobs: data.data, pagination: data.meta?.pagination };
  },

  async getById(id: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<BulkPredictionJob>>(`/dashboard/bulk-predictions/${id}`);
    return data.data;
  },

  async upload(file: File, name: string, availableCouriers: string[]) {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('availableCouriers', availableCouriers.join(','));
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ publicId: string; status: string; totalRows: number; message: string }>
    >('/dashboard/bulk-predictions/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.data;
  },

  async download(id: string) {
    const response = await apiClient.get(`/dashboard/bulk-predictions/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bulk_prediction_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadTemplate() {
    const response = await apiClient.get('/dashboard/bulk-predictions/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk_order_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
