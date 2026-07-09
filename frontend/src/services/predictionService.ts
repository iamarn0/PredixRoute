import { apiClient } from './apiClient';
import { ApiSuccessResponse, PaginationMeta, PredictionResult } from '../types/api.types';

export interface EvaluatePayload {
  destinationPincode: string;
  deliveryAddress: string;
  weightGrams: number;
  cod: boolean;
  codAmount?: number | null;
  orderValue: number;
  availableCouriers: string[];
  externalRef?: string;
  customerPhone?: string;
  customerName?: string;
  productName?: string;
}

export const predictionService = {
  async evaluate(payload: EvaluatePayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<PredictionResult>>(
      '/dashboard/predictions/evaluate',
      payload,
    );
    return data.data;
  },

  async evaluateAndVerify(payload: EvaluatePayload) {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{
        prediction: PredictionResult;
        codVerification: { triggered: boolean; skippedReason: string | null };
      }>
    >('/dashboard/predictions/evaluate-and-verify', payload);
    return data.data;
  },

  async list(page = 1, limit = 20) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<PredictionResult[]> & { meta?: { pagination: PaginationMeta } }
    >('/dashboard/predictions', { params: { page, limit } });
    return { predictions: data.data, pagination: data.meta?.pagination };
  },

  async getById(id: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<PredictionResult>>(`/dashboard/predictions/${id}`);
    return data.data;
  },
};
