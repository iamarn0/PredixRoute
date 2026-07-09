import { getRedis } from '../config/redis';
import { apiPlanRepository } from '../repositories/apiPlan.repository';
import { apiSubscriptionRepository } from '../repositories/apiSubscription.repository';
import { ApiError } from '../utils/apiError';

const DEFAULT_LIMITS = {
  rateLimitPerMinute: 60,
  predictionsPerDay: 500,
  apiCallsPerMonth: 10000,
  batchSizeMax: 10,
};

export class ApiUsageService {
  async getPlanLimits(organizationId: string) {
    const subscription = await apiSubscriptionRepository.findByOrganization(organizationId);
    if (!subscription) return DEFAULT_LIMITS;

    const plan = await apiPlanRepository.findById(subscription.planId.toString());
    return plan?.limits ?? DEFAULT_LIMITS;
  }

  async checkRateLimit(organizationId: string, overrideLimit: number | null): Promise<void> {
    const limits = await this.getPlanLimits(organizationId);
    const max = overrideLimit ?? limits.rateLimitPerMinute;
    const redis = getRedis();
    const minute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:${organizationId}:${minute}`;

    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);

    if (count > max) {
      throw ApiError.tooManyRequests('Rate limit exceeded. Retry after 60 seconds.');
    }
  }

  async checkPredictionLimit(organizationId: string): Promise<void> {
    await this.checkMonthlyQuota(organizationId);
    const limits = await this.getPlanLimits(organizationId);
    if (limits.predictionsPerDay < 0) return;

    const redis = getRedis();
    const day = new Date().toISOString().slice(0, 10);
    const key = `predictions:daily:${organizationId}:${day}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400);

    if (count > limits.predictionsPerDay) {
      throw ApiError.tooManyRequests('Daily prediction quota exceeded.', 'QUOTA_EXCEEDED');
    }
  }

  async checkMonthlyQuota(organizationId: string): Promise<void> {
    const limits = await this.getPlanLimits(organizationId);
    if (limits.apiCallsPerMonth < 0) return;

    const redis = getRedis();
    const month = new Date().toISOString().slice(0, 7);
    const key = `apiusage:monthly:${organizationId}:${month}`;
    const current = Number((await redis.get(key)) ?? 0);

    if (current >= limits.apiCallsPerMonth) {
      throw ApiError.tooManyRequests('Monthly API quota exceeded.', 'QUOTA_EXCEEDED');
    }
  }

  async incrementMonthlyUsage(organizationId: string): Promise<void> {
    const redis = getRedis();
    const month = new Date().toISOString().slice(0, 7);
    const key = `apiusage:monthly:${organizationId}:${month}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 86400 * 32);
  }

  async getUsageSummary(organizationId: string) {
    const limits = await this.getPlanLimits(organizationId);
    const redis = getRedis();
    const month = new Date().toISOString().slice(0, 7);
    const day = new Date().toISOString().slice(0, 10);
    const [monthlyCalls, dailyPredictions] = await Promise.all([
      redis.get(`apiusage:monthly:${organizationId}:${month}`),
      redis.get(`predictions:daily:${organizationId}:${day}`),
    ]);

    return {
      month,
      apiCallsUsed: Number(monthlyCalls ?? 0),
      apiCallsLimit: limits.apiCallsPerMonth,
      predictionsUsedToday: Number(dailyPredictions ?? 0),
      predictionsDailyLimit: limits.predictionsPerDay,
      rateLimitPerMinute: limits.rateLimitPerMinute,
    };
  }

  async incrementApiUsage(organizationId: string, endpoint: string): Promise<void> {
    await this.incrementMonthlyUsage(organizationId);
    const redis = getRedis();
    const month = new Date().toISOString().slice(0, 7);
    const key = `apiusage:${organizationId}:${month}:${endpoint}`;
    await redis.incr(key);
    await redis.expire(key, 86400 * 32);
  }
}

export const apiUsageService = new ApiUsageService();
