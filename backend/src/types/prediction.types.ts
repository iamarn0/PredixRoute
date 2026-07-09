export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PredictionSource = 'DASHBOARD' | 'PUBLIC_API' | 'BATCH' | 'DEMO';

export interface EvaluateContext {
  source: PredictionSource;
  apiKeyId?: string;
  requestId?: string;
  usageEndpoint?: string;
  apiEndpoint?: string;
  triggerCodVerification?: boolean;
  skipUsageTracking?: boolean;
  operationalLogOnly?: boolean;
}

export interface RiskEvaluateInput {
  destinationPincode: string;
  deliveryAddress?: string;
  weightGrams: number;
  cod: boolean;
  codAmount?: number | null;
  orderValue: number;
  addressQualityScore?: number;
  addressAnalysis?: import('./address.types').AddressAnalysis;
  availableCouriers: string[];
  externalRef?: string;
  customerPhone?: string;
  customerName?: string;
  productName?: string;
}

export interface ShapExplanation {
  feature: string;
  value: number | string;
  impact: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  description: string;
}

export interface CourierRanking {
  courier: string;
  score: number;
  successProbability: number;
  breakdown: {
    successWeight: number;
    performanceWeight: number;
    rtoWeight: number;
    slaWeight: number;
    costWeight: number;
  };
}

export interface AiPredictionResponse {
  deliveryProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedCourier: string;
  courierRankings: CourierRanking[];
  explanations: ShapExplanation[];
  modelId: string;
  modelVersion: string;
}
