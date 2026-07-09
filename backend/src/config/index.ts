import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  AI_SERVICE_URL: z.string().url(),
  AI_SERVICE_INTERNAL_TOKEN: z.string().min(16),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  ADMIN_REGISTRATION_SECRET: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().email().optional().default('noreply@predixroute.com'),
  DATASET_ROOT: z.string().optional().default(''),
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_WHATSAPP_FROM: z.string().optional().default(''),
  TWILIO_WHATSAPP_TEMPLATE_SID: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  TWILIO_WEBHOOK_BASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : 'http://localhost:3000'))
    .pipe(z.string().url()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const envData = parsed.data;

export const config = {
  env: envData.NODE_ENV,
  port: envData.PORT,
  mongodbUri: envData.MONGODB_URI,
  redisUrl: envData.REDIS_URL,
  jwt: {
    accessSecret: envData.JWT_ACCESS_SECRET,
    refreshSecret: envData.JWT_REFRESH_SECRET,
    accessExpiry: envData.JWT_ACCESS_EXPIRY,
    refreshExpiry: envData.JWT_REFRESH_EXPIRY,
  },
  aiService: {
    url: envData.AI_SERVICE_URL,
    internalToken: envData.AI_SERVICE_INTERNAL_TOKEN,
  },
  frontendUrl: envData.FRONTEND_URL,
  logLevel: envData.LOG_LEVEL,
  isProduction: envData.NODE_ENV === 'production',
  adminRegistrationSecret: envData.ADMIN_REGISTRATION_SECRET,
  email: {
    smtpHost: envData.SMTP_HOST || '',
    smtpPort: envData.SMTP_PORT,
    smtpSecure: envData.SMTP_SECURE,
    smtpUser: envData.SMTP_USER || '',
    smtpPass: envData.SMTP_PASS || '',
    from: envData.EMAIL_FROM,
  },
  datasetRoot: envData.DATASET_ROOT || path.resolve(process.cwd(), '../data/datasets'),
  twilio: {
    accountSid: envData.TWILIO_ACCOUNT_SID || '',
    authToken: envData.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: envData.TWILIO_WHATSAPP_FROM || '',
    whatsappTemplateSid: envData.TWILIO_WHATSAPP_TEMPLATE_SID || '',
    webhookBaseUrl: envData.TWILIO_WEBHOOK_BASE_URL,
  },
  openai: {
    apiKey: envData.OPENAI_API_KEY || '',
    model: envData.OPENAI_MODEL,
  },
};

export function isTwilioConfigured(): boolean {
  return Boolean(
    envData.TWILIO_ACCOUNT_SID && envData.TWILIO_AUTH_TOKEN && envData.TWILIO_WHATSAPP_FROM,
  );
}

export function isOpenAiConfigured(): boolean {
  return Boolean(envData.OPENAI_API_KEY);
}
