import { ApiError } from '../utils/apiError';
import { predictionRepository } from '../repositories/prediction.repository';
import { aiOrchestratorService } from './aiOrchestrator.service';
import { apiUsageService } from './apiUsage.service';
import { webhookService } from './webhook.service';
import { codVerificationService } from './codVerification.service';
import {
  EvaluateContext,
  RiskEvaluateInput,
} from '../types/prediction.types';
import { IPrediction } from '../models/prediction.model';
import { Types } from 'mongoose';
import { getPlatformOrganizationId } from '../utils/platformOrg';
import { enrichEvaluateInput } from '../utils/addressAnalysis';

export class PredictionService {
  async evaluateRisk(
    organizationId: string,
    input: RiskEvaluateInput,
    context: EvaluateContext,
  ): Promise<IPrediction> {
    if (!context.skipUsageTracking) {
      await apiUsageService.checkPredictionLimit(organizationId);
    }

    const enrichedInput = enrichEvaluateInput(input);

    const startMs = Date.now();
    const aiResult = await aiOrchestratorService.predictRisk(
      organizationId,
      enrichedInput,
      context.requestId,
    );
    const latencyMs = Date.now() - startMs;

    const prediction = await predictionRepository.createPrediction(organizationId, {
      input: {
        destinationPincode: enrichedInput.destinationPincode,
        deliveryAddress: enrichedInput.deliveryAddress,
        weightGrams: enrichedInput.weightGrams,
        cod: enrichedInput.cod,
        codAmount: enrichedInput.codAmount ?? null,
        orderValue: enrichedInput.orderValue,
        addressQualityScore: enrichedInput.addressQualityScore ?? 0.5,
        addressAnalysis: enrichedInput.addressAnalysis,
        availableCouriers: enrichedInput.availableCouriers,
        externalRef: enrichedInput.externalRef,
        customerPhone: enrichedInput.customerPhone,
        customerName: enrichedInput.customerName,
        productName: enrichedInput.productName,
      },
      output: {
        deliveryProbability: aiResult.deliveryProbability,
        riskScore: aiResult.riskScore,
        riskLevel: aiResult.riskLevel,
        recommendedCourier: aiResult.recommendedCourier,
        courierRankings: aiResult.courierRankings as unknown[],
      },
      explanations: aiResult.explanations as unknown[],
      modelVersion: aiResult.modelVersion,
      source: context.source,
      apiKeyId: context.apiKeyId ? new Types.ObjectId(context.apiKeyId) : null,
      apiEndpoint: context.apiEndpoint ?? null,
      operationalLogOnly: context.operationalLogOnly ?? true,
      latencyMs,
    });

    if (!context.skipUsageTracking) {
      await apiUsageService.incrementApiUsage(
        organizationId,
        context.usageEndpoint ?? '/public/risk/evaluate',
      );
    }

    const publicResponse = this.mapToPublicResponse(prediction);
    void webhookService.dispatch(organizationId, 'prediction.completed', publicResponse).catch(() => {});

    if (context.triggerCodVerification) {
      void codVerificationService.maybeStartFromPrediction(organizationId, prediction).catch(() => {});
    }

    return prediction;
  }

  async evaluateAndVerify(
    organizationId: string,
    input: RiskEvaluateInput,
    context: Omit<EvaluateContext, 'triggerCodVerification'>,
  ) {
    const prediction = await this.evaluateRisk(organizationId, input, {
      ...context,
      triggerCodVerification: true,
    });

    const settings = await codVerificationService.getOrgSettings(organizationId);
    const verificationStarted = codVerificationService.shouldTriggerForPrediction(prediction, settings);

    return {
      prediction: this.mapToPublicResponse(prediction),
      codVerification: {
        triggered: verificationStarted,
        skippedReason: verificationStarted
          ? null
          : this.getVerificationSkippedReason(prediction, settings),
      },
    };
  }

  async evaluateDemo(input: RiskEvaluateInput, requestId?: string) {
    const platformOrgId = await getPlatformOrganizationId();
    const enrichedInput = enrichEvaluateInput(input);
    const startMs = Date.now();
    const aiResult = await aiOrchestratorService.predictRisk(platformOrgId, enrichedInput, requestId);
    const latencyMs = Date.now() - startMs;

    return {
      destinationPincode: enrichedInput.destinationPincode,
      deliveryAddress: enrichedInput.deliveryAddress,
      deliveryProbability: aiResult.deliveryProbability,
      riskScore: aiResult.riskScore,
      riskLevel: aiResult.riskLevel,
      recommendedCourier: aiResult.recommendedCourier,
      courierRankings: aiResult.courierRankings,
      explanations: aiResult.explanations,
      modelVersion: aiResult.modelVersion,
      evaluatedAt: new Date().toISOString(),
      latencyMs,
      addressQualityScore: enrichedInput.addressQualityScore,
      addressAnalysis: enrichedInput.addressAnalysis,
      demo: true,
    };
  }

  async evaluateBatch(
    organizationId: string,
    items: RiskEvaluateInput[],
    context: EvaluateContext,
  ) {
    const limits = await apiUsageService.getPlanLimits(organizationId);
    if (items.length > limits.batchSizeMax) {
      throw ApiError.badRequest(
        'BATCH_TOO_LARGE',
        `Batch size exceeds plan limit of ${limits.batchSizeMax}`,
      );
    }

    const results = [];
    for (const item of items) {
      results.push(
        this.mapToPublicResponse(
          await this.evaluateRisk(organizationId, item, {
            ...context,
            usageEndpoint: context.usageEndpoint ?? '/public/batch/evaluate',
          }),
        ),
      );
    }

    void webhookService
      .dispatch(organizationId, 'prediction.batch_completed', { count: results.length, results })
      .catch(() => {});

    return results;
  }

  async evaluateBatchAndVerify(
    organizationId: string,
    items: RiskEvaluateInput[],
    context: Omit<EvaluateContext, 'triggerCodVerification'>,
  ) {
    const limits = await apiUsageService.getPlanLimits(organizationId);
    if (items.length > limits.batchSizeMax) {
      throw ApiError.badRequest(
        'BATCH_TOO_LARGE',
        `Batch size exceeds plan limit of ${limits.batchSizeMax}`,
      );
    }

    const results = [];
    for (const item of items) {
      results.push(
        await this.evaluateAndVerify(organizationId, item, {
          ...context,
          usageEndpoint: context.usageEndpoint ?? '/public/batch/evaluate-and-verify',
        }),
      );
    }

    void webhookService
      .dispatch(organizationId, 'prediction.batch_completed', {
        count: results.length,
        results: results.map((r) => r.prediction),
      })
      .catch(() => {});

    return results;
  }

  async listPredictions(organizationId: string, page: number, limit: number) {
    return predictionRepository.findAll(organizationId, { page, limit });
  }

  async getPrediction(organizationId: string, publicId: string) {
    const prediction = await predictionRepository.findByPublicId(publicId, organizationId);
    if (!prediction) {
      throw ApiError.notFound('Prediction');
    }
    return prediction;
  }

  mapToPublicResponse(prediction: IPrediction) {
    return {
      predictionId: prediction.publicId,
      destinationPincode: prediction.input.destinationPincode,
      deliveryAddress: prediction.input.deliveryAddress,
      deliveryProbability: prediction.output.deliveryProbability,
      riskScore: prediction.output.riskScore,
      riskLevel: prediction.output.riskLevel,
      recommendedCourier: prediction.output.recommendedCourier,
      courierRankings: prediction.output.courierRankings,
      explanations: prediction.explanations,
      modelVersion: prediction.modelVersion,
      evaluatedAt: prediction.createdAt.toISOString(),
      externalRef: prediction.input.externalRef,
      customerPhone: prediction.input.customerPhone,
      addressQualityScore: prediction.input.addressQualityScore,
      addressAnalysis: prediction.input.addressAnalysis,
      verificationEligible: this.isVerificationEligible(prediction),
      source: prediction.source,
      apiEndpoint: prediction.apiEndpoint,
    };
  }

  isVerificationEligible(prediction: IPrediction): boolean {
    if (!prediction.input.cod || !prediction.input.customerPhone) return false;
    return ['MEDIUM', 'HIGH', 'CRITICAL'].includes(prediction.output.riskLevel);
  }

  private getVerificationSkippedReason(
    prediction: IPrediction,
    settings: Awaited<ReturnType<typeof codVerificationService.getOrgSettings>>,
  ): string {
    if (!settings.enabled) return 'COD verification disabled in organization settings';
    if (!prediction.input.cod || !prediction.input.customerPhone) {
      return 'COD order with customer phone required';
    }
    if (!settings.riskLevels.includes(prediction.output.riskLevel)) {
      return `Risk level ${prediction.output.riskLevel} not configured for verification`;
    }
    return 'Verification not started (duplicate session or messaging unavailable)';
  }
}

export const predictionService = new PredictionService();
