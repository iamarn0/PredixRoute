import { apiClient } from './apiClient';
import { ApiSuccessResponse } from '../types/api.types';

export interface UsageSummary {
  month: string;
  apiCallsUsed: number;
  apiCallsLimit: number;
  predictionsUsedToday: number;
  predictionsDailyLimit: number;
  rateLimitPerMinute: number;
}

export const analyticsService = {
  async getUsage() {
    const { data } = await apiClient.get<ApiSuccessResponse<UsageSummary>>('/dashboard/analytics/usage');
    return data.data;
  },
};
