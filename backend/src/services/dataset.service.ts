import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Types } from 'mongoose';
import { datasetRepository } from '../repositories/dataset.repository';
import { processDatasetCsv } from './datasetProcessing.service';
import { aiOrchestratorService } from './aiOrchestrator.service';
import { ApiError } from '../utils/apiError';
import { ensureDatasetDir, resolveDatasetPath, toRelativePath } from '../utils/datasetStorage';
import { generatePublicId } from '../utils/idUtils';
import { IDataset } from '../models/dataset.model';

export class DatasetService {
  async list(organizationId: string, page: number, limit: number) {
    const result = await datasetRepository.listByOrganization(organizationId, page, limit);
    return {
      data: result.data.map((d) => this.toPublic(d)),
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
    const dataset = await datasetRepository.findByPublicId(organizationId, publicId);
    if (!dataset) throw ApiError.notFound('Dataset');
    return this.toPublic(dataset);
  }

  async upload(organizationId: string, userId: string, file: Express.Multer.File, name: string, description?: string) {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw ApiError.badRequest('INVALID_FILE', 'Only CSV files are supported');
    }
    if (file.size > 100 * 1024 * 1024) {
      throw ApiError.badRequest('FILE_TOO_LARGE', 'Maximum file size is 100 MB');
    }

    const datasetPublicId = generatePublicId('dset');
    const dir = await ensureDatasetDir(organizationId, datasetPublicId);
    const rawPath = path.join(dir, 'raw.csv');
    await fs.writeFile(rawPath, file.buffer);
    const storageRelativePath = toRelativePath(rawPath);

    const dataset = await datasetRepository.create({
      publicId: datasetPublicId,
      organizationId: new Types.ObjectId(organizationId),
      name,
      description: description ?? '',
      status: 'PROCESSING',
      originalFileName: file.originalname,
      fileSizeBytes: file.size,
      storageRelativePath,
      uploadedBy: new Types.ObjectId(userId),
    });

    await this.processDatasetJob(dataset._id.toString(), organizationId, dataset.publicId);

    const updated = await datasetRepository.findByPublicId(organizationId, dataset.publicId);
    return {
      publicId: dataset.publicId,
      name: dataset.name,
      status: updated?.status ?? 'PROCESSING',
      message:
        updated?.status === 'READY'
          ? 'Dataset processed and ready for training.'
          : updated?.errorMessage ?? 'Dataset processing failed. Review quality issues.',
    };
  }

  async processDatasetJob(datasetId: string, organizationId: string, datasetPublicId: string) {
    const dataset = await datasetRepository.findByPublicId(organizationId, datasetPublicId);
    if (!dataset) return;

    try {
      const result = await processDatasetCsv(dataset.storageRelativePath, organizationId, datasetPublicId);
      const hasErrors = result.qualityIssues.some((i) => i.severity === 'ERROR');

      await datasetRepository.updateById(datasetId, {
        status: hasErrors ? 'FAILED' : 'READY',
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
      await datasetRepository.updateById(datasetId, {
        status: 'FAILED',
        errorMessage: String(err),
      });
    }
  }

  async startTraining(organizationId: string, publicId: string) {
    const dataset = await datasetRepository.findByPublicId(organizationId, publicId);
    if (!dataset) throw ApiError.notFound('Dataset');
    if (dataset.status !== 'READY' && dataset.status !== 'TRAINED') {
      throw ApiError.badRequest('DATASET_NOT_READY', 'Dataset must be in READY status before training');
    }
    if (!dataset.processedRelativePath) {
      throw ApiError.badRequest('NO_PROCESSED_DATA', 'Processed dataset file is missing');
    }

    await datasetRepository.updateById(dataset._id.toString(), {
      status: 'TRAINING',
      errorMessage: null,
    });

    await this.runTrainingJob(dataset._id.toString(), organizationId, publicId, dataset.processedRelativePath);

    const updated = await datasetRepository.findByPublicId(organizationId, publicId);
    return {
      message: updated?.status === 'TRAINED' ? 'Model trained successfully.' : updated?.errorMessage ?? 'Training failed',
      status: updated?.status ?? 'TRAINING',
      trainingMetrics: updated?.trainingMetrics ?? null,
    };
  }

  async runTrainingJob(
    datasetId: string,
    organizationId: string,
    _datasetPublicId: string,
    processedRelativePath: string,
  ) {
    try {
      const metrics = await aiOrchestratorService.trainModel(organizationId, processedRelativePath);
      await datasetRepository.updateById(datasetId, {
        status: 'TRAINED',
        trainingMetrics: {
          accuracy: metrics.accuracy,
          f1Score: metrics.f1Score,
          sampleCount: metrics.sampleCount,
          modelId: metrics.modelId,
          trainedAt: new Date(),
        },
        errorMessage: null,
      });
    } catch (err) {
      await datasetRepository.updateById(datasetId, {
        status: 'FAILED',
        errorMessage: `Training failed: ${String(err)}`,
      });
    }
  }

  async preview(organizationId: string, publicId: string, limit = 20) {
    const dataset = await datasetRepository.findByPublicId(organizationId, publicId);
    if (!dataset) throw ApiError.notFound('Dataset');

    const relative = dataset.processedRelativePath ?? dataset.storageRelativePath;
    const filePath = resolveDatasetPath(relative);
    const content = await fs.readFile(filePath, 'utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];

    return {
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows: rows.slice(0, limit),
      totalRows: dataset.rowCount || rows.length,
    };
  }

  getTemplateCsv(): string {
    return [
      'destination_pincode,weight_grams,cod,cod_amount,order_value,courier,status',
      '110001,1200,true,1200,2500,delhivery,delivered',
      '400001,800,false,0,1800,bluedart,delivered',
      '560001,2500,true,2500,5200,dtdc,rto',
      '700001,500,false,0,950,ecom_express,delivered',
    ].join('\n');
  }

  private toPublic(dataset: {
    publicId: string;
    name: string;
    description: string;
    status: string;
    originalFileName: string;
    fileSizeBytes: number;
    rowCount: number;
    qualityScore: number;
    qualityIssues: IDataset['qualityIssues'];
    columnMapping: Record<string, string>;
    trainingMetrics: IDataset['trainingMetrics'];
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      publicId: dataset.publicId,
      name: dataset.name,
      description: dataset.description,
      status: dataset.status,
      originalFileName: dataset.originalFileName,
      fileSizeBytes: dataset.fileSizeBytes,
      rowCount: dataset.rowCount,
      qualityScore: dataset.qualityScore,
      qualityIssues: dataset.qualityIssues,
      columnMapping: dataset.columnMapping,
      trainingMetrics: dataset.trainingMetrics,
      errorMessage: dataset.errorMessage,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
    };
  }
}

export const datasetService = new DatasetService();
