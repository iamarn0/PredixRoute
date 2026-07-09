import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import { trainingContributionRepository } from '../repositories/trainingContribution.repository';
import { organizationRepository } from '../repositories/organization.repository';
import { processDatasetCsv } from './datasetProcessing.service';
import { ApiError } from '../utils/apiError';
import { ensureDatasetDir, resolveDatasetPath, toRelativePath } from '../utils/datasetStorage';
import { generatePublicId } from '../utils/idUtils';
import { ITrainingContribution } from '../models/trainingContribution.model';
import { getPlatformOrganizationId } from '../utils/platformOrg';

const FORBIDDEN_TRAINING_COLUMNS = [
  'risk_score',
  'riskscore',
  'risk_level',
  'risklevel',
  'model_version',
  'modelversion',
  'delivery_probability',
  'prediction_id',
];

export class TrainingContributionService {
  private async requireConsent(organizationId: string) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization');
    if (!org.settings?.trainingData?.allowTrainingDataUse) {
      throw ApiError.forbidden(
        'Enable training data sharing in Settings before uploading or syncing shipment data.',
      );
    }
    return org;
  }

  async list(organizationId: string, page: number, limit: number) {
    const result = await trainingContributionRepository.listByOrganization(organizationId, page, limit);
    return {
      data: result.data.map((c) => this.toPublic(c)),
      pagination: this.pagination(result.page, result.limit, result.total),
    };
  }

  async get(organizationId: string, publicId: string) {
    const contribution = await trainingContributionRepository.findByPublicId(organizationId, publicId);
    if (!contribution) throw ApiError.notFound('Training contribution');
    return this.toPublic(contribution);
  }

  async uploadCsv(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    name: string,
    description?: string,
  ) {
    await this.requireConsent(organizationId);

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw ApiError.badRequest('INVALID_FILE', 'Only CSV files are supported');
    }
    if (file.size > 100 * 1024 * 1024) {
      throw ApiError.badRequest('FILE_TOO_LARGE', 'Maximum file size is 100 MB');
    }

    this.assertNoModelOutputColumns(file.buffer.toString('utf-8'));

    const publicId = generatePublicId('tct');
    const dir = await ensureDatasetDir(organizationId, `training/${publicId}`);
    const rawPath = path.join(dir, 'raw.csv');
    await fs.writeFile(rawPath, file.buffer);

    const contribution = await trainingContributionRepository.create({
      publicId,
      organizationId: new Types.ObjectId(organizationId),
      name,
      description: description ?? '',
      source: 'CSV_UPLOAD',
      status: 'PROCESSING',
      originalFileName: file.originalname,
      fileSizeBytes: file.size,
      storageRelativePath: toRelativePath(rawPath),
      uploadedBy: new Types.ObjectId(userId),
    });

    await this.processContribution(contribution._id.toString(), organizationId, publicId);

    const updated = await trainingContributionRepository.findByPublicId(organizationId, publicId);
    return {
      publicId,
      name,
      status: updated?.status ?? 'PROCESSING',
      message:
        updated?.status === 'PENDING_REVIEW'
          ? 'Historical shipment data uploaded and queued for admin review.'
          : updated?.errorMessage ?? 'Processing failed.',
    };
  }

  async ingestOutcomeApiBatch(
    organizationId: string,
    items: Array<{
      externalRef: string;
      destinationPincode: string;
      weightGrams: number;
      cod: boolean;
      codAmount?: number | null;
      orderValue: number;
      courier: string;
      status: string;
      addressQualityScore?: number;
    }>,
  ) {
    await this.requireConsent(organizationId);

    const header =
      'external_ref,destination_pincode,weight_grams,cod,cod_amount,order_value,courier,status,address_quality_score\n';
    const rows = items.map((item) =>
      [
        item.externalRef,
        item.destinationPincode,
        item.weightGrams,
        item.cod,
        item.codAmount ?? '',
        item.orderValue,
        item.courier,
        item.status,
        item.addressQualityScore ?? 0.5,
      ].join(','),
    );
    const csv = header + rows.join('\n');

    const publicId = generatePublicId('tct');
    const dir = await ensureDatasetDir(organizationId, `training/${publicId}`);
    const rawPath = path.join(dir, 'raw.csv');
    await fs.writeFile(rawPath, csv);

    const contribution = await trainingContributionRepository.create({
      publicId,
      organizationId: new Types.ObjectId(organizationId),
      name: `Outcome API sync ${new Date().toISOString().slice(0, 10)}`,
      description: `${items.length} shipments from seller outcome API`,
      source: 'OUTCOME_API',
      status: 'PROCESSING',
      originalFileName: null,
      fileSizeBytes: Buffer.byteLength(csv),
      storageRelativePath: toRelativePath(rawPath),
      uploadedBy: null,
    });

    await this.processContribution(contribution._id.toString(), organizationId, publicId);

    const updated = await trainingContributionRepository.findByPublicId(organizationId, publicId);
    return {
      publicId,
      status: updated?.status ?? 'PROCESSING',
      rowCount: updated?.rowCount ?? 0,
    };
  }

  async processContribution(contributionId: string, organizationId: string, publicId: string) {
    const contribution = await trainingContributionRepository.findByPublicId(organizationId, publicId);
    if (!contribution?.storageRelativePath) return;

    try {
      const result = await processDatasetCsv(
        contribution.storageRelativePath,
        organizationId,
        `training/${publicId}`,
      );
      const hasErrors = result.qualityIssues.some((i) => i.severity === 'ERROR');

      await trainingContributionRepository.updateById(contributionId, {
        status: hasErrors ? 'FAILED' : 'PENDING_REVIEW',
        processedRelativePath: result.processedRelativePath || null,
        rowCount: result.rowCount,
        qualityScore: result.qualityScore,
        qualityIssues: result.qualityIssues,
        columnMapping: result.columnMapping,
        errorMessage: hasErrors
          ? result.qualityIssues.find((i) => i.severity === 'ERROR')?.message ?? 'Processing failed'
          : null,
      });
    } catch (err) {
      await trainingContributionRepository.updateById(contributionId, {
        status: 'FAILED',
        errorMessage: String(err),
      });
    }
  }

  async listPendingReview(page: number, limit: number) {
    const result = await trainingContributionRepository.listByStatus('PENDING_REVIEW', page, limit);
    return {
      data: result.data.map((c) => this.toAdminPublic(c)),
      pagination: this.pagination(result.page, result.limit, result.total),
    };
  }

  async approve(contributionPublicId: string, adminUserId: string, notes?: string) {
    const contribution = await trainingContributionRepository.findByPublicIdAny(contributionPublicId);
    if (!contribution) throw ApiError.notFound('Training contribution');
    if (contribution.status !== 'PENDING_REVIEW') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only PENDING_REVIEW contributions can be approved');
    }

    await trainingContributionRepository.updateById(contribution._id.toString(), {
      status: 'APPROVED',
      reviewNotes: notes ?? null,
      reviewedBy: new Types.ObjectId(adminUserId),
      reviewedAt: new Date(),
    });

    return { publicId: contributionPublicId, status: 'APPROVED' };
  }

  async reject(contributionPublicId: string, adminUserId: string, notes?: string) {
    const contribution = await trainingContributionRepository.findByPublicIdAny(contributionPublicId);
    if (!contribution) throw ApiError.notFound('Training contribution');
    if (contribution.status !== 'PENDING_REVIEW') {
      throw ApiError.badRequest('INVALID_STATUS', 'Only PENDING_REVIEW contributions can be rejected');
    }

    await trainingContributionRepository.updateById(contribution._id.toString(), {
      status: 'REJECTED',
      reviewNotes: notes ?? null,
      reviewedBy: new Types.ObjectId(adminUserId),
      reviewedAt: new Date(),
    });

    return { publicId: contributionPublicId, status: 'REJECTED' };
  }

  async merge(contributionPublicId: string, adminUserId: string) {
    const contribution = await trainingContributionRepository.findByPublicIdAny(contributionPublicId);
    if (!contribution) throw ApiError.notFound('Training contribution');
    if (contribution.status !== 'APPROVED') {
      throw ApiError.badRequest('INVALID_STATUS', 'Contribution must be APPROVED before merge');
    }
    if (!contribution.processedRelativePath) {
      throw ApiError.badRequest('NO_PROCESSED_DATA', 'Processed file missing');
    }

    const platformOrgId = await getPlatformOrganizationId();
    const platformDir = await ensureDatasetDir(platformOrgId, `merged/${contributionPublicId}`);
    const destPath = path.join(platformDir, 'contribution.csv');
    const resolvedSrc = resolveDatasetPath(contribution.processedRelativePath);
    await fs.copyFile(resolvedSrc, destPath);

    await trainingContributionRepository.updateById(contribution._id.toString(), {
      status: 'MERGED',
      mergedAt: new Date(),
      reviewedBy: new Types.ObjectId(adminUserId),
    });

    return {
      publicId: contributionPublicId,
      status: 'MERGED',
      message: 'Contribution merged into platform training pool. Trigger retrain from Model Training.',
    };
  }

  private assertNoModelOutputColumns(csvContent: string) {
    const firstLine = csvContent.split('\n')[0]?.toLowerCase() ?? '';
    const headers = firstLine.split(',').map((h) => h.trim().replace(/"/g, ''));
    for (const forbidden of FORBIDDEN_TRAINING_COLUMNS) {
      if (headers.includes(forbidden)) {
        throw ApiError.badRequest(
          'MODEL_OUTPUT_FORBIDDEN',
          `Training data must not include model output columns (${forbidden}). Use real shipment outcomes only.`,
        );
      }
    }
  }

  private toPublic(contribution: ITrainingContribution) {
    return {
      publicId: contribution.publicId,
      name: contribution.name,
      description: contribution.description,
      source: contribution.source,
      status: contribution.status,
      originalFileName: contribution.originalFileName,
      rowCount: contribution.rowCount,
      qualityScore: contribution.qualityScore,
      qualityIssues: contribution.qualityIssues,
      reviewNotes: contribution.reviewNotes,
      errorMessage: contribution.errorMessage,
      createdAt: contribution.createdAt,
      updatedAt: contribution.updatedAt,
    };
  }

  private toAdminPublic(contribution: ITrainingContribution) {
    return {
      ...this.toPublic(contribution),
      organizationId: contribution.organizationId.toString(),
    };
  }

  private pagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }
}

export const trainingContributionService = new TrainingContributionService();
