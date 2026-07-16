import axios, { AxiosInstance, isAxiosError } from 'axios';
import { config } from '../config';
import {
  AiPredictionResponse,
  CourierRanking,
  RiskEvaluateInput,
  ShapExplanation,
} from '../types/prediction.types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import { pincodeService } from './pincode.service';
import { courierService } from './courier.service';
import { getPlatformOrganizationId } from '../utils/platformOrg';

interface RawAiResponse {
  delivery_probability?: number;
  deliveryProbability?: number;
  risk_score?: number;
  riskScore?: number;
  risk_level?: string;
  riskLevel?: string;
  recommended_courier?: string;
  recommendedCourier?: string;
  courier_rankings?: RawCourierRanking[];
  courierRankings?: CourierRanking[];
  explanations?: ShapExplanation[];
  model_id?: string;
  modelId?: string;
  model_version?: string;
  modelVersion?: string;
}

interface RawCourierRanking {
  courier: string;
  score: number;
  success_probability?: number;
  successProbability?: number;
  breakdown: CourierRanking['breakdown'];
}

function mapAiResponse(raw: RawAiResponse): AiPredictionResponse {
  const rankings = (raw.courier_rankings ?? raw.courierRankings ?? []).map((r: RawCourierRanking) => ({
    courier: r.courier,
    score: r.score,
    successProbability: r.success_probability ?? r.successProbability ?? 0,
    breakdown: r.breakdown,
  }));

  return {
    deliveryProbability: raw.delivery_probability ?? raw.deliveryProbability ?? 0,
    riskScore: raw.risk_score ?? raw.riskScore ?? 0,
    riskLevel: (raw.risk_level ?? raw.riskLevel ?? 'MEDIUM') as AiPredictionResponse['riskLevel'],
    recommendedCourier: raw.recommended_courier ?? raw.recommendedCourier ?? '',
    courierRankings: rankings,
    explanations: raw.explanations ?? [],
    modelId: raw.model_id ?? raw.modelId ?? 'mdl_default',
    modelVersion: raw.model_version ?? raw.modelVersion ?? '1.0.0',
  };
}

function formatAiValidationError(detail: unknown): string {
  if (!Array.isArray(detail)) return 'Invalid prediction input';
  return detail
    .map((item) => {
      if (item && typeof item === 'object' && 'msg' in item) {
        const loc = 'loc' in item && Array.isArray(item.loc) ? item.loc.join('.') : 'input';
        return `${loc}: ${String(item.msg)}`;
      }
      return String(item);
    })
    .join('; ');
}

export class AiOrchestratorService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aiService.url,
      timeout: 30000,
      headers: {
        'X-Internal-Token': config.aiService.internalToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async predictRisk(
    organizationId: string,
    input: RiskEvaluateInput,
    requestId?: string,
  ): Promise<AiPredictionResponse> {
    try {
      const pincodeIntel = await pincodeService.getIntelligence(organizationId, input.destinationPincode);
      const courierContexts = await Promise.all(
        input.availableCouriers.map((courier) => courierService.getIntelligence(organizationId, courier)),
      );

      const courierBreakdown = (pincodeIntel.courierBreakdown as Array<{
        courierCode: string;
        successRate: number;
        rtoRate: number;
        avgDeliveryDays: number;
      }>).map((item) => ({
        courier_code: item.courierCode,
        success_rate: item.successRate,
        rto_rate: item.rtoRate,
        avg_delivery_days: item.avgDeliveryDays,
      }));

      const modelOrganizationId = await getPlatformOrganizationId();

      const { data } = await this.client.post<{ data: RawAiResponse }>(
        '/internal/v1/predict/risk',
        {
          organization_id: modelOrganizationId,
          destination_pincode: input.destinationPincode,
          delivery_address: input.deliveryAddress,
          weight_grams: input.weightGrams,
          cod: input.cod,
          cod_amount: input.codAmount ?? null,
          order_value: input.orderValue,
          address_quality_score: input.addressQualityScore ?? 0.5,
          address_analysis: input.addressAnalysis
            ? {
                quality_score: input.addressAnalysis.qualityScore,
                pincode_match: input.addressAnalysis.pincodeMatch,
                has_house_number: input.addressAnalysis.hasHouseNumber,
                has_street_or_area: input.addressAnalysis.hasStreetOrArea,
                has_landmark: input.addressAnalysis.hasLandmark,
                issues: input.addressAnalysis.issues,
              }
            : null,
          available_couriers: input.availableCouriers,
          external_ref: input.externalRef,
          pincode_context: {
            risk_score: pincodeIntel.riskScore,
            success_rate: pincodeIntel.successRate,
            rto_rate: pincodeIntel.rtoRate,
            avg_delivery_days: pincodeIntel.avgDeliveryDays,
            tier: pincodeIntel.tier,
            source: pincodeIntel.source,
            courier_breakdown: courierBreakdown,
          },
          courier_contexts: courierContexts.map((courier) => ({
            courier_code: courier.courierCode,
            success_rate: courier.successRate,
            rto_rate: courier.rtoRate,
            avg_delivery_days: courier.avgDeliveryDays,
            avg_cost_per_kg: courier.avgCostPerKg,
            source: courier.source,
          })),
        },
        { headers: requestId ? { 'X-Request-Id': requestId } : {} },
      );
      return mapAiResponse(data.data);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        logger.error(
          `AI service predictRisk failed for org ${organizationId}: ${status} ${JSON.stringify(detail)}`,
        );
        if (status === 422) {
          throw ApiError.badRequest('AI_VALIDATION_FAILED', formatAiValidationError(detail));
        }
        if (status === 503) {
          throw new ApiError(
            503,
            'AI_SERVICE_UNAVAILABLE',
            typeof detail === 'string' ? detail : 'AI prediction service is temporarily unavailable',
          );
        }
      } else {
        logger.error(`AI service predictRisk failed for org ${organizationId}: ${String(err)}`);
      }
      throw new ApiError(503, 'AI_SERVICE_UNAVAILABLE', 'AI prediction service is temporarily unavailable');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data } = await this.client.get('/internal/v1/health');
      return data?.status === 'healthy' || data?.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  async trainModel(organizationId: string, processedRelativePath: string) {
    try {
      const { data } = await this.client.post<{ data: {
        accuracy: number;
        f1_score?: number;
        f1Score?: number;
        sample_count?: number;
        sampleCount?: number;
        model_id?: string;
        modelId?: string;
      } }>(
        '/internal/v1/train',
        {
          organization_id: organizationId,
          dataset_relative_path: processedRelativePath,
        },
        { timeout: 600000 },
      );
      return {
        accuracy: data.data.accuracy,
        f1Score: data.data.f1_score ?? data.data.f1Score,
        sampleCount: data.data.sample_count ?? data.data.sampleCount,
        modelId: data.data.model_id ?? data.data.modelId,
      };
    } catch (err) {
      logger.error(`AI service trainModel failed for org ${organizationId}: ${String(err)}`);
      throw new ApiError(503, 'TRAINING_FAILED', 'Model training service failed');
    }
  }
}

export const aiOrchestratorService = new AiOrchestratorService();
