import { Schema, model, Document, Types } from 'mongoose';
import { generatePublicId } from '../utils/idUtils';

export type BulkPredictionJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IBulkPredictionJob extends Document {
  publicId: string;
  organizationId: Types.ObjectId;
  name: string;
  status: BulkPredictionJobStatus;
  originalFileName: string;
  fileSizeBytes: number;
  totalRows: number;
  processedRows: number;
  inputRelativePath: string;
  outputRelativePath: string | null;
  availableCouriers: string[];
  errorMessage: string | null;
  uploadedBy: Types.ObjectId;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bulkPredictionJobSchema = new Schema<IBulkPredictionJob>(
  {
    publicId: { type: String, required: true, unique: true, default: () => generatePublicId('bpj') },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
    },
    originalFileName: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    inputRelativePath: { type: String, required: true },
    outputRelativePath: { type: String, default: null },
    availableCouriers: [{ type: String }],
    errorMessage: { type: String, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bulkPredictionJobSchema.index({ organizationId: 1, createdAt: -1 });

export const BulkPredictionJobModel = model<IBulkPredictionJob>('BulkPredictionJob', bulkPredictionJobSchema);
