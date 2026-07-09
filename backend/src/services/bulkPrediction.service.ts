import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import { bulkPredictionJobRepository } from '../repositories/bulkPredictionJob.repository';
import { predictionService } from './prediction.service';
import { ApiError } from '../utils/apiError';
import { ensureDatasetDir, resolveDatasetPath, toRelativePath } from '../utils/datasetStorage';
import { generatePublicId } from '../utils/idUtils';
import { RiskEvaluateInput } from '../types/prediction.types';
import { bulkPredictionQueue } from '../jobs/queues';
import {
  BULK_ORDER_TEMPLATE_FILENAME,
  getBulkOrderTemplatePath,
  isSupportedBulkOrderFile,
  mapBulkOrderRow,
  parseBulkOrderFile,
} from '../utils/bulkOrderFileParser';

function rowToInput(row: Record<string, string>, defaultCouriers: string[]): RiskEvaluateInput | null {
  return mapBulkOrderRow(row, defaultCouriers);
}

export class BulkPredictionService {
  async list(organizationId: string, page: number, limit: number) {
    const result = await bulkPredictionJobRepository.listByOrganization(organizationId, page, limit);
    return {
      data: result.data.map((j) => this.toPublic(j)),
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

  async get(organizationId: string, publicId: string) {
    const job = await bulkPredictionJobRepository.findByPublicId(organizationId, publicId);
    if (!job) throw ApiError.notFound('Bulk prediction job');
    return this.toPublic(job);
  }

  async createUploadJob(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    name: string,
    availableCouriers: string[],
  ) {
    if (!isSupportedBulkOrderFile(file.originalname)) {
      throw ApiError.badRequest('INVALID_FILE', 'Only CSV or Excel (.xlsx) files are supported');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw ApiError.badRequest('FILE_TOO_LARGE', 'Maximum file size is 50 MB');
    }
    if (availableCouriers.length === 0) {
      throw ApiError.badRequest('NO_COURIERS', 'At least one courier must be selected');
    }

    const publicId = generatePublicId('bpj');
    const dir = await ensureDatasetDir(organizationId, `bulk-predict/${publicId}`);
    const inputPath = path.join(dir, 'input.csv');
    const rows = parseBulkOrderFile(file.buffer, file.originalname);
    await fs.writeFile(inputPath, this.rowsToCsv(rows));

    const job = await bulkPredictionJobRepository.create({
      publicId,
      organizationId: new Types.ObjectId(organizationId),
      name,
      status: 'QUEUED',
      originalFileName: file.originalname,
      fileSizeBytes: file.size,
      totalRows: rows.length,
      processedRows: 0,
      inputRelativePath: toRelativePath(inputPath),
      availableCouriers,
      uploadedBy: new Types.ObjectId(userId),
    });

    await bulkPredictionQueue.add('process', {
      jobId: job._id.toString(),
      organizationId,
      publicId,
    });

    return {
      publicId: job.publicId,
      status: job.status,
      totalRows: rows.length,
      message: 'Bulk prediction job queued. Poll status or download when complete.',
    };
  }

  async processJob(jobId: string, organizationId: string, publicId: string) {
    const job = await bulkPredictionJobRepository.findByPublicId(organizationId, publicId);
    if (!job) return;

    await bulkPredictionJobRepository.updateById(jobId, { status: 'PROCESSING' });

    try {
      const inputPath = resolveDatasetPath(job.inputRelativePath);
      const content = await fs.readFile(inputPath, 'utf-8');
      const rows = parseBulkOrderFile(Buffer.from(content, 'utf-8'), 'input.csv');

      const outputRows: Record<string, string | number>[] = [];
      let processed = 0;

      for (const row of rows) {
        const input = rowToInput(row, job.availableCouriers);
        if (!input) {
          outputRows.push({ ...row, error: 'Missing Shipping Pincode or delivery address' });
          processed += 1;
          continue;
        }

        try {
          const prediction = await predictionService.evaluateRisk(organizationId, input, {
            source: 'BATCH',
            apiEndpoint: '/dashboard/bulk-predictions',
            usageEndpoint: '/dashboard/bulk-predictions',
            triggerCodVerification: false,
            operationalLogOnly: true,
          });
          const response = predictionService.mapToPublicResponse(prediction);
          outputRows.push({
            ...row,
            prediction_id: response.predictionId,
            delivery_probability: response.deliveryProbability,
            risk_score: response.riskScore,
            risk_level: response.riskLevel,
            recommended_courier: response.recommendedCourier,
            model_version: response.modelVersion,
          });
        } catch (err) {
          outputRows.push({ ...row, error: String(err) });
        }

        processed += 1;
        if (processed % 10 === 0) {
          await bulkPredictionJobRepository.updateById(jobId, { processedRows: processed });
        }
      }

      const dir = path.dirname(inputPath);
      const outputPath = path.join(dir, 'output.csv');
      const csv = this.rowsToCsv(outputRows);
      await fs.writeFile(outputPath, csv);

      await bulkPredictionJobRepository.updateById(jobId, {
        status: 'COMPLETED',
        processedRows: processed,
        outputRelativePath: toRelativePath(outputPath),
        completedAt: new Date(),
      });
    } catch (err) {
      await bulkPredictionJobRepository.updateById(jobId, {
        status: 'FAILED',
        errorMessage: String(err),
      });
    }
  }

  getTemplatePath(): { path: string; filename: string } {
    return {
      path: getBulkOrderTemplatePath(),
      filename: BULK_ORDER_TEMPLATE_FILENAME,
    };
  }

  async getDownloadPath(organizationId: string, publicId: string): Promise<{ path: string; filename: string }> {
    const job = await bulkPredictionJobRepository.findByPublicId(organizationId, publicId);
    if (!job) throw ApiError.notFound('Bulk prediction job');
    if (job.status !== 'COMPLETED' || !job.outputRelativePath) {
      throw ApiError.badRequest('JOB_NOT_READY', 'Job is not complete or output unavailable');
    }
    return {
      path: resolveDatasetPath(job.outputRelativePath),
      filename: `${job.name.replace(/\s+/g, '_')}_results.csv`,
    };
  }

  private rowsToCsv(rows: Record<string, string | number>[]): string {
    if (rows.length === 0) return '';
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const escape = (v: string | number) => {
      const s = String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h] ?? '')).join(','));
    }
    return lines.join('\n');
  }

  private toPublic(job: {
    publicId: string;
    name: string;
    status: string;
    originalFileName: string;
    fileSizeBytes: number;
    totalRows: number;
    processedRows: number;
    availableCouriers: string[];
    errorMessage: string | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      publicId: job.publicId,
      name: job.name,
      status: job.status,
      originalFileName: job.originalFileName,
      fileSizeBytes: job.fileSizeBytes,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      progressPercent: job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0,
      availableCouriers: job.availableCouriers,
      errorMessage: job.errorMessage,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}

export const bulkPredictionService = new BulkPredictionService();
