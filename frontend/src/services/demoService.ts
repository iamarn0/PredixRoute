import axios from 'axios';
import { EvaluatePayload } from './predictionService';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type DemoPredictionResult = {
  destinationPincode: string;
  deliveryAddress?: string;
  deliveryProbability: number;
  riskScore: number;
  riskLevel: string;
  recommendedCourier: string;
  courierRankings: unknown[];
  explanations: unknown[];
  modelVersion: string;
  evaluatedAt: string;
  addressQualityScore?: number;
  addressAnalysis?: {
    qualityScore: number;
    issues: string[];
    strengths: string[];
    pincodeMatch: boolean;
    pincodeInAddress?: string | null;
  };
  demo: boolean;
};

export const demoService = {
  async evaluate(payload: EvaluatePayload) {
    const { data } = await axios.post<{ success: boolean; data: DemoPredictionResult }>(
      `${baseURL}/public/demo/risk/evaluate`,
      payload,
      { timeout: 30000 },
    );
    return data.data;
  },
};
