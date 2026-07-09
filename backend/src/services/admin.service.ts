import mongoose from 'mongoose';
import { getRedis } from '../config/redis';
import { organizationRepository } from '../repositories/organization.repository';
import { userRepository } from '../repositories/user.repository';
import { apiSubscriptionRepository } from '../repositories/apiSubscription.repository';
import { UserModel } from '../models/user.model';
import { PredictionModel } from '../models/prediction.model';
import { ApiSubscriptionModel } from '../models/apiSubscription.model';
import { ApiError } from '../utils/apiError';
import { aiOrchestratorService } from './aiOrchestrator.service';
import { config } from '../config';
import { datasetService } from './dataset.service';
import { datasetRepository } from '../repositories/dataset.repository';
import { getPlatformOrganizationId } from '../utils/platformOrg';

type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';

export class AdminService {
  private async enrichOrganizations(
    orgs: Array<{
      _id: { toString: () => string };
      publicId: string;
      name: string;
      slug: string;
      status: string;
      billingEmail: string;
      createdAt: Date;
    }>,
  ) {
    return Promise.all(
      orgs.map(async (org) => {
        const userCount = await UserModel.countDocuments({ organizationId: org._id, deletedAt: null });
        const predictionCount = await PredictionModel.countDocuments({ organizationId: org._id });
        return {
          publicId: org.publicId,
          name: org.name,
          slug: org.slug,
          status: org.status,
          billingEmail: org.billingEmail,
          userCount,
          predictionCount,
          createdAt: org.createdAt,
        };
      }),
    );
  }

  async listOrganizations(
    page: number,
    limit: number,
    search?: string,
    status?: OrgStatus,
  ) {
    const result = await organizationRepository.findAllFiltered(search, status, page, limit);
    const enriched = await this.enrichOrganizations(result.data as Parameters<typeof this.enrichOrganizations>[0]);

    return {
      data: enriched,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page * result.limit < result.total,
        hasPrev: result.page > 1,
      },
    };
  }

  async getOrganization(publicId: string) {
    const org = await organizationRepository.findByPublicId(publicId);
    if (!org || org.slug === 'predixroute-platform') {
      throw ApiError.notFound('Organization');
    }

    const [userCount, predictionCount, subscription] = await Promise.all([
      UserModel.countDocuments({ organizationId: org._id, deletedAt: null }),
      PredictionModel.countDocuments({ organizationId: org._id }),
      apiSubscriptionRepository.findWithPlanByOrganization(org._id.toString()),
    ]);

    return {
      publicId: org.publicId,
      name: org.name,
      slug: org.slug,
      status: org.status,
      industry: org.industry,
      billingEmail: org.billingEmail,
      settings: org.settings,
      userCount,
      predictionCount,
      createdAt: org.createdAt,
      subscription: subscription
        ? {
            planName: subscription.planName ?? 'Unknown',
            planSlug: subscription.planSlug ?? null,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
          }
        : null,
    };
  }

  async updateOrganizationStatus(publicId: string, status: OrgStatus) {
    const org = await organizationRepository.findByPublicId(publicId);
    if (!org) throw ApiError.notFound('Organization');

    const updated = await organizationRepository.updateStatus(org._id.toString(), status);
    return { publicId: updated?.publicId, status: updated?.status };
  }

  async listUsers(page: number, limit: number, search?: string, organizationId?: string) {
    const result = await userRepository.findAllAdmin(page, limit, search, organizationId);

    const data = result.data.map((user: {
      publicId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      status: string;
      lastLoginAt: Date | null;
      createdAt: Date;
      organizationId: unknown;
      organizationName?: string;
      organizationSlug?: string;
    }) => ({
      publicId: user.publicId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      organizationName: user.organizationName ?? 'Unknown',
      organizationSlug: user.organizationSlug ?? null,
    }));

    return {
      data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page * result.limit < result.total,
        hasPrev: result.page > 1,
      },
    };
  }

  async getPlatformStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      organizations,
      activeOrganizations,
      suspendedOrganizations,
      users,
      predictions,
      predictionsToday,
      trialSubscriptions,
      aiHealthy,
    ] = await Promise.all([
      organizationRepository.countAll(),
      organizationRepository.countByStatus('ACTIVE'),
      organizationRepository.countByStatus('SUSPENDED'),
      UserModel.countDocuments({ deletedAt: null }),
      PredictionModel.countDocuments(),
      PredictionModel.countDocuments({ createdAt: { $gte: startOfDay } }),
      ApiSubscriptionModel.countDocuments({ status: 'TRIAL' }),
      aiOrchestratorService.healthCheck(),
    ]);

    return {
      organizations,
      activeOrganizations,
      suspendedOrganizations,
      users,
      predictions,
      predictionsToday,
      trialSubscriptions,
      aiServiceHealthy: aiHealthy,
      environment: config.env,
    };
  }

  async listTrainingDatasets(page: number, limit: number) {
    const platformOrgId = await getPlatformOrganizationId();
    return datasetService.list(platformOrgId, page, limit);
  }

  async uploadTrainingDataset(
    adminUserId: string,
    file: Express.Multer.File,
    name: string,
    description?: string,
  ) {
    const platformOrgId = await getPlatformOrganizationId();
    return datasetService.upload(platformOrgId, adminUserId, file, name, description);
  }

  async trainTrainingDataset(datasetPublicId: string) {
    const platformOrgId = await getPlatformOrganizationId();
    const dataset = await datasetRepository.findByPublicId(platformOrgId, datasetPublicId);
    if (!dataset) throw ApiError.notFound('Dataset');
    return datasetService.startTraining(platformOrgId, datasetPublicId);
  }

  getDatasetTemplateCsv() {
    return datasetService.getTemplateCsv();
  }

  async getSystemHealth() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};

    const mongoStart = Date.now();
    checks.mongodb = {
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - mongoStart,
    };

    const redisStart = Date.now();
    try {
      const pong = await getRedis().ping();
      checks.redis = { status: pong === 'PONG' ? 'healthy' : 'unhealthy', latencyMs: Date.now() - redisStart };
    } catch {
      checks.redis = { status: 'unhealthy', latencyMs: Date.now() - redisStart };
    }

    const aiStart = Date.now();
    const aiHealthy = await aiOrchestratorService.healthCheck();
    checks.aiService = { status: aiHealthy ? 'healthy' : 'unhealthy', latencyMs: Date.now() - aiStart };

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      service: 'predixroute-backend',
      environment: config.env,
    };
  }
}

export const adminService = new AdminService();
