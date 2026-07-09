import { apiClient } from './apiClient';
import { ApiSuccessResponse, PaginationMeta, RiskLevel } from '../types/api.types';

export type CodVerificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'IN_PROGRESS'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NEEDS_REVIEW';

export type CodVerificationMessage = {
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  aiIntent?: string;
  createdAt: string;
};

export type CodVerificationItem = {
  verificationId: string;
  predictionId: string;
  externalRef?: string;
  customerPhone: string;
  customerName: string;
  productName?: string;
  codAmount: number;
  orderValue: number;
  destinationPincode: string;
  status: CodVerificationStatus;
  riskLevel: RiskLevel;
  turnCount: number;
  maxTurns: number;
  expiresAt: string;
  messages: CodVerificationMessage[];
  terminalReason?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  extractedPincode?: string;
  extractedLandmark?: string;
  createdAt: string;
  updatedAt: string;
};

export type CodMessagingConfig = {
  isConfigured: boolean;
  whatsappSender: string | null;
  whatsappSenderDisplay: string;
  businessName: string;
  mode: 'template' | 'session' | 'simulated';
  usesTemplate: boolean;
  inboundWebhookUrl: string;
  customerInstructions: string;
};

export type StartCodVerificationPayload = {
  predictionId?: string;
  externalRef?: string;
  customerPhone?: string;
  customerName?: string;
  productName?: string;
  destinationPincode?: string;
  codAmount?: number;
  orderValue?: number;
};

export type ResolveCodVerificationPayload = {
  action: 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW';
  note?: string;
  notifyCustomer?: boolean;
};

export const codVerificationService = {
  async getMessagingConfig() {
    const { data } = await apiClient.get<ApiSuccessResponse<CodMessagingConfig>>(
      '/dashboard/cod-verifications/messaging-config',
    );
    return data.data;
  },

  async list(page = 1, limit = 20, status?: CodVerificationStatus) {
    const { data } = await apiClient.get<
      ApiSuccessResponse<CodVerificationItem[]> & { meta?: { pagination: PaginationMeta } }
    >('/dashboard/cod-verifications', { params: { page, limit, status } });
    return { items: data.data, pagination: data.meta?.pagination };
  },

  async getById(id: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<CodVerificationItem>>(
      `/dashboard/cod-verifications/${id}`,
    );
    return data.data;
  },

  async start(payload: StartCodVerificationPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<CodVerificationItem>>(
      '/dashboard/cod-verifications',
      payload,
    );
    return data.data;
  },

  async resolve(id: string, payload: ResolveCodVerificationPayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<CodVerificationItem>>(
      `/dashboard/cod-verifications/${id}/resolve`,
      payload,
    );
    return data.data;
  },
};
