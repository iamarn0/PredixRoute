import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';
import { IDatasetQualityIssue } from './dataset.model';

export type TrainingContributionStatus =
  | 'UPLOADING'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MERGED'
  | 'FAILED';

export type TrainingContributionSource = 'CSV_UPLOAD' | 'OUTCOME_API' | 'WEBHOOK_SYNC';

export interface ITrainingContribution extends Document {
  publicId: string;
  organizationId: Types.ObjectId;
  name: string;
  description: string;
  source: TrainingContributionSource;
  status: TrainingContributionStatus;
  originalFileName: string | null;
  fileSizeBytes: number;
  rowCount: number;
  storageRelativePath: string | null;
  processedRelativePath: string | null;
  columnMapping: Record<string, string>;
  qualityScore: number;
  qualityIssues: IDatasetQualityIssue[];
  reviewNotes: string | null;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  mergedAt: Date | null;
  errorMessage: string | null;
  uploadedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const trainingContributionSchema = new Schema<ITrainingContribution>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('tct') },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 500 },
    source: {
      type: String,
      enum: ['CSV_UPLOAD', 'OUTCOME_API', 'WEBHOOK_SYNC'],
      default: 'CSV_UPLOAD',
    },
    status: {
      type: String,
      enum: ['UPLOADING', 'PROCESSING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'MERGED', 'FAILED'],
      default: 'UPLOADING',
    },
    originalFileName: { type: String, default: null },
    fileSizeBytes: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    storageRelativePath: { type: String, default: null },
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
    reviewNotes: { type: String, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    mergedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

trainingContributionSchema.index({ organizationId: 1, createdAt: -1 });
trainingContributionSchema.index({ status: 1, createdAt: -1 });

export const TrainingContributionModel = model<ITrainingContribution>(
  'TrainingContribution',
  trainingContributionSchema,
);
