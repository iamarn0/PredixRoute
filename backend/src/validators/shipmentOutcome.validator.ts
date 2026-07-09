import { z } from 'zod';

const shipmentOutcomeItemSchema = z.object({
  externalRef: z.string().min(1).max(100),
  destinationPincode: z.string().regex(/^\d{6}$/),
  weightGrams: z.number().int().positive().max(100_000),
  cod: z.boolean(),
  codAmount: z.number().nonnegative().nullable().optional(),
  orderValue: z.number().nonnegative(),
  courier: z.string().min(1).max(50),
  status: z.string().min(1).max(50),
  addressQualityScore: z.number().min(0).max(1).optional(),
});

export const shipmentOutcomeSchema = shipmentOutcomeItemSchema;

export const shipmentOutcomeBatchSchema = z.object({
  shipments: z.array(shipmentOutcomeItemSchema).min(1).max(500),
});

export const trainingContributionUploadSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

export const bulkPredictionUploadSchema = z.object({
  name: z.string().min(1).max(200),
  availableCouriers: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean))),
});

export const trainingReviewSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const trainingConsentSchema = z.object({
  allowTrainingDataUse: z.boolean(),
  termsAccepted: z.boolean().optional(),
  webhookSyncUrl: z.string().url().max(500).nullable().optional(),
  webhookSyncSecret: z.string().min(8).max(128).nullable().optional(),
});
