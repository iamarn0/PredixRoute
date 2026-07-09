export type DatasetRecord = {
  publicId: string;
  name: string;
  description: string;
  status: string;
  originalFileName: string;
  fileSizeBytes: number;
  rowCount: number;
  qualityScore: number;
  qualityIssues: Array<{ severity: string; message: string; column?: string }>;
  columnMapping: Record<string, string>;
  trainingMetrics: {
    accuracy?: number;
    f1Score?: number;
    sampleCount?: number;
    modelId?: string;
    trainedAt?: string;
  } | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};
