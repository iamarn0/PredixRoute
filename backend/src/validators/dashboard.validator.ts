import { z } from 'zod';

const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const webhookEventSchema = z.enum([
  'prediction.completed',
  'prediction.batch_completed',
  'cod.verification.started',
  'cod.verification.confirmed',
  'cod.verification.rejected',
  'cod.verification.expired',
  'cod.verification.needs_review',
]);

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  environment: z.enum(['LIVE', 'TEST']),
  scopes: z
    .array(
      z.enum([
        'risk:evaluate',
        'recommendation',
        'batch',
        'pincode:read',
        'courier:read',
        'cod:verify',
      ]),
    )
    .optional(),
});

export const pincodeParamSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
});

export const courierParamSchema = z.object({
  courier: z.string().min(1).max(50),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(webhookEventSchema).min(1).default(['prediction.completed']),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  billingEmail: z.string().email().optional(),
  settings: z
    .object({
      timezone: z.string().max(64).optional(),
      defaultCurrency: z.string().length(3).optional(),
      dataRetentionDays: z.number().int().min(30).max(3650).optional(),
      codVerification: z
        .object({
          enabled: z.boolean().optional(),
          riskLevels: z.array(riskLevelSchema).min(1).max(4).optional(),
          expiryHours: z.number().int().min(1).max(168).optional(),
          maxTurns: z.number().int().min(1).max(10).optional(),
        })
        .optional(),
      trainingData: z
        .object({
          allowTrainingDataUse: z.boolean().optional(),
          webhookSyncUrl: z.string().url().max(500).nullable().optional(),
          webhookSyncSecret: z.string().min(8).max(128).nullable().optional(),
        })
        .optional(),
    })
    .optional(),
});
