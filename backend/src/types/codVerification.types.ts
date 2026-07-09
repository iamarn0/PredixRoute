import { RiskLevel } from './prediction.types';

export type CodVerificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'IN_PROGRESS'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NEEDS_REVIEW';

export type CodVerificationMessageDirection = 'INBOUND' | 'OUTBOUND';

export type CodVerificationAiIntent =
  | 'CONFIRM'
  | 'REJECT'
  | 'FIX_ADDRESS'
  | 'UNCLEAR'
  | 'PREPAID_INTEREST'
  | 'ABUSE';

export type CodVerificationAiAction =
  | 'CONFIRM_ORDER'
  | 'REJECT_ORDER'
  | 'ASK_ADDRESS'
  | 'WAIT'
  | 'ESCALATE';

export interface CodVerificationMessage {
  direction: CodVerificationMessageDirection;
  body: string;
  aiIntent?: CodVerificationAiIntent;
  createdAt: Date;
}

export interface CodVerificationSettings {
  enabled: boolean;
  riskLevels: RiskLevel[];
  expiryHours: number;
  maxTurns: number;
}

export const DEFAULT_COD_VERIFICATION_SETTINGS: CodVerificationSettings = {
  enabled: true,
  riskLevels: ['MEDIUM', 'HIGH', 'CRITICAL'],
  expiryHours: 24,
  maxTurns: 4,
};

export const ACTIVE_COD_VERIFICATION_STATUSES: CodVerificationStatus[] = [
  'PENDING',
  'SENT',
  'IN_PROGRESS',
];

export const TERMINAL_COD_VERIFICATION_STATUSES: CodVerificationStatus[] = [
  'CONFIRMED',
  'REJECTED',
  'EXPIRED',
  'NEEDS_REVIEW',
];
