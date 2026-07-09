export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export interface Organization {
  publicId: string;
  name: string;
  slug: string;
}

export interface PredictionResult {
  predictionId: string;
  destinationPincode?: string;
  deliveryAddress?: string;
  deliveryProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedCourier: string;
  courierRankings: unknown[];
  explanations: Array<{
    feature: string;
    value: number | string;
    impact: number;
    direction: string;
    description: string;
  }>;
  modelVersion: string;
  evaluatedAt: string;
  externalRef?: string;
  customerPhone?: string;
  addressQualityScore?: number;
  addressAnalysis?: {
    qualityScore: number;
    pincodeMatch: boolean;
    pincodeInAddress?: string | null;
    hasHouseNumber: boolean;
    hasStreetOrArea: boolean;
    issues: string[];
    strengths: string[];
  };
  verificationEligible?: boolean;
}

export interface ApiKeyItem {
  publicId: string;
  name: string;
  keyPrefix: string;
  environment: 'LIVE' | 'TEST';
  scopes: string[];
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  requestId?: string;
  meta?: { pagination?: PaginationMeta };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PincodeIntelligence {
  pincode: string;
  city: string;
  state: string;
  tier: string;
  riskScore: number;
  successRate: number;
  rtoRate: number;
  avgDeliveryDays: number;
  bestCourier: string | null;
  worstCourier: string | null;
  source?: 'DATABASE' | 'DEFAULT';
}

export interface AdminOrganization {
  publicId: string;
  name: string;
  slug: string;
  status: string;
  billingEmail: string;
  userCount: number;
  predictionCount: number;
  createdAt: string;
}

export interface AdminOrganizationDetail extends AdminOrganization {
  industry: string;
  settings: {
    timezone: string;
    defaultCurrency: string;
    dataRetentionDays: number;
  };
  subscription: {
    planName: string;
    planSlug: string | null;
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt: string | null;
  } | null;
}

export interface AdminUser {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  organizationName: string;
  organizationSlug: string | null;
}

export interface AdminStats {
  organizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  users: number;
  predictions: number;
  predictionsToday: number;
  trialSubscriptions: number;
  aiServiceHealthy: boolean;
  environment: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  service: string;
  environment: string;
  checks: Record<string, { status: string; latencyMs?: number }>;
}
