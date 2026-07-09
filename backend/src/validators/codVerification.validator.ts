import { z } from 'zod';

const e164PhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone — use E.164 format e.g. +919876543210');

export const startCodVerificationSchema = z.object({
  predictionId: z.string().min(1).optional(),
  externalRef: z.string().max(100).optional(),
  customerPhone: e164PhoneSchema.optional(),
  customerName: z.string().min(1).max(100).optional(),
  productName: z.string().min(1).max(200).optional(),
  destinationPincode: z.string().regex(/^\d{6}$/).optional(),
  codAmount: z.number().positive().optional(),
  orderValue: z.number().positive().optional(),
});

export const codVerificationParamSchema = z.object({
  id: z.string().min(1),
});

export const codVerificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z
    .enum(['PENDING', 'SENT', 'IN_PROGRESS', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'NEEDS_REVIEW'])
    .optional(),
});

export const resolveCodVerificationSchema = z.object({
  action: z.enum(['CONFIRM', 'REJECT', 'NEEDS_REVIEW']),
  note: z.string().max(500).optional(),
  notifyCustomer: z.boolean().optional().default(false),
});
