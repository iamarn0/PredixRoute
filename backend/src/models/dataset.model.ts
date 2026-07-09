import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';

export type DatasetStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'TRAINING' | 'TRAINED';

export interface IDatasetQualityIssue {
  severity: 'ERROR' | 'WARNING';
  message: string;
  column?: string;
}

export interface IDataset extends Document {
  publicId: string;
  organizationId: Types.ObjectId;
  name: string;
  description: string;
  status: DatasetStatus;
  originalFileName: string;
  fileSizeBytes: number;
  rowCount: number;
  storageRelativePath: string;
  processedRelativePath: string | null;
  columnMapping: Record<string, string>;
  qualityScore: number;
  qualityIssues: IDatasetQualityIssue[];
  trainingMetrics: {
    accuracy?: number;
    f1Score?: number;
    sampleCount?: number;
    modelId?: string;
    trainedAt?: Date;
  } | null;
  errorMessage: string | null;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const datasetSchema = new Schema<IDataset>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('dset') },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'TRAINING', 'TRAINED'],
      default: 'UPLOADING',
    },
    originalFileName: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    rowCount: { type: Number, default: 0 },
    storageRelativePath: { type: String, required: true },
    processedRelativePath: { type: String, default: null },
    columnMapping: { type: Schema.Types.Mixed, default: {} },
    qualityScore: { type: Number, default: 0 },
    qualityIssues: {
      type: [
        {
          severity: { type: String, enum: ['ERROR', 'WARNING'] },
          message: String,
          column: String,
        },
      ],
      default: [],
    },
    trainingMetrics: { type: Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

datasetSchema.index({ organizationId: 1, createdAt: -1 });

export const DatasetModel = model<IDataset>('Dataset', datasetSchema);
