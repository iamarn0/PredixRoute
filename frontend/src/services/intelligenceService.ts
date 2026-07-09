import { apiClient } from './apiClient';
import { ApiSuccessResponse, PincodeIntelligence } from '../types/api.types';

export const intelligenceService = {
  async getPincode(pincode: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<PincodeIntelligence>>(
      `/dashboard/pincodes/${pincode}`,
    );
    return data.data;
  },
};
