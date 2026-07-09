import { z } from 'zod';

const e164PhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone — use E.164 format e.g. +919876543210');

const deliveryAddressSchema = z
  .string()
  .trim()
  .min(15, 'Enter the complete delivery address (house, street, area, city, pincode)')
  .max(500);

export const riskEvaluateSchema = z
  .object({
    destinationPincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
    deliveryAddress: deliveryAddressSchema,
    weightGrams: z.number().int().min(1).max(50000),
    cod: z.boolean(),
    codAmount: z.number().positive().nullable().optional(),
    orderValue: z.number().positive(),
    addressQualityScore: z.number().min(0).max(1).optional(),
    availableCouriers: z.array(z.string().min(1)).min(1).max(20),
    externalRef: z.string().max(100).optional(),
    customerPhone: e164PhoneSchema.optional(),
    customerName: z.string().min(1).max(100).optional(),
    productName: z.string().min(1).max(200).optional(),
  })
  .refine((data) => !data.cod || (data.codAmount != null && data.codAmount > 0), {
    message: 'codAmount required when cod is true',
    path: ['codAmount'],
  });

export const batchEvaluateSchema = z.object({
  items: z.array(riskEvaluateSchema).min(1).max(50),
});
