import { pincodePerformanceRepository } from '../repositories/pincodePerformance.repository';
import { ApiError } from '../utils/apiError';

const PINCODE_META: Record<string, { city: string; state: string; tier: 'METRO' | 'TIER1' | 'TIER2' | 'TIER3' | 'RURAL' }> = {
  '110001': { city: 'New Delhi', state: 'Delhi', tier: 'METRO' },
  '400001': { city: 'Mumbai', state: 'Maharashtra', tier: 'METRO' },
  '560001': { city: 'Bengaluru', state: 'Karnataka', tier: 'METRO' },
  '700001': { city: 'Kolkata', state: 'West Bengal', tier: 'METRO' },
  '700064': { city: 'Kolkata', state: 'West Bengal', tier: 'METRO' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', tier: 'METRO' },
  '845401': { city: 'Motihari', state: 'Bihar', tier: 'RURAL' },
};

const TIER_COURIER_BREAKDOWN: Record<
  string,
  Array<{ courierCode: string; successRate: number; rtoRate: number; avgDeliveryDays: number }>
> = {
  METRO: [
    { courierCode: 'bluedart', successRate: 0.94, rtoRate: 0.06, avgDeliveryDays: 2.4 },
    { courierCode: 'delhivery', successRate: 0.92, rtoRate: 0.08, avgDeliveryDays: 2.6 },
    { courierCode: 'ecom_express', successRate: 0.9, rtoRate: 0.1, avgDeliveryDays: 2.9 },
    { courierCode: 'dtdc', successRate: 0.88, rtoRate: 0.12, avgDeliveryDays: 3.2 },
  ],
  TIER1: [
    { courierCode: 'delhivery', successRate: 0.91, rtoRate: 0.09, avgDeliveryDays: 2.8 },
    { courierCode: 'bluedart', successRate: 0.9, rtoRate: 0.1, avgDeliveryDays: 2.9 },
    { courierCode: 'dtdc', successRate: 0.87, rtoRate: 0.13, avgDeliveryDays: 3.4 },
    { courierCode: 'ecom_express', successRate: 0.88, rtoRate: 0.12, avgDeliveryDays: 3.2 },
  ],
  TIER2: [
    { courierCode: 'delhivery', successRate: 0.89, rtoRate: 0.11, avgDeliveryDays: 3.2 },
    { courierCode: 'dtdc', successRate: 0.86, rtoRate: 0.14, avgDeliveryDays: 3.8 },
    { courierCode: 'ecom_express', successRate: 0.87, rtoRate: 0.13, avgDeliveryDays: 3.5 },
    { courierCode: 'bluedart', successRate: 0.88, rtoRate: 0.12, avgDeliveryDays: 3.4 },
  ],
  TIER3: [
    { courierCode: 'dtdc', successRate: 0.84, rtoRate: 0.16, avgDeliveryDays: 4.2 },
    { courierCode: 'delhivery', successRate: 0.86, rtoRate: 0.14, avgDeliveryDays: 3.9 },
    { courierCode: 'ecom_express', successRate: 0.83, rtoRate: 0.17, avgDeliveryDays: 4.4 },
    { courierCode: 'bluedart', successRate: 0.82, rtoRate: 0.18, avgDeliveryDays: 4.5 },
  ],
  RURAL: [
    { courierCode: 'dtdc', successRate: 0.8, rtoRate: 0.2, avgDeliveryDays: 5.5 },
    { courierCode: 'delhivery', successRate: 0.78, rtoRate: 0.22, avgDeliveryDays: 5.8 },
    { courierCode: 'ecom_express', successRate: 0.76, rtoRate: 0.24, avgDeliveryDays: 6.0 },
    { courierCode: 'bluedart', successRate: 0.72, rtoRate: 0.28, avgDeliveryDays: 6.2 },
  ],
};

export class PincodeService {
  async getIntelligence(organizationId: string, pincode: string) {
    if (!/^\d{6}$/.test(pincode)) {
      throw ApiError.badRequest('INVALID_PINCODE', 'Pincode must be 6 digits');
    }

    const record = await pincodePerformanceRepository.findByPincode(organizationId, pincode);
    if (record) {
      return this.mapRecord(record);
    }

    const meta = PINCODE_META[pincode] ?? { city: 'Unknown', state: 'Unknown', tier: 'TIER2' as const };
    const courierBreakdown = TIER_COURIER_BREAKDOWN[meta.tier] ?? TIER_COURIER_BREAKDOWN.TIER2;
    const bestCourier = courierBreakdown[0]?.courierCode ?? null;
    const worstCourier = courierBreakdown[courierBreakdown.length - 1]?.courierCode ?? null;

    return {
      pincode,
      city: meta.city,
      state: meta.state,
      tier: meta.tier,
      riskScore: meta.tier === 'RURAL' ? 62 : meta.tier === 'METRO' ? 28 : 45,
      successRate: meta.tier === 'RURAL' ? 0.72 : meta.tier === 'METRO' ? 0.91 : 0.85,
      rtoRate: meta.tier === 'RURAL' ? 0.28 : meta.tier === 'METRO' ? 0.09 : 0.15,
      avgDeliveryDays: meta.tier === 'RURAL' ? 5.5 : meta.tier === 'METRO' ? 2.8 : 4.0,
      bestCourier,
      worstCourier,
      courierBreakdown,
      trend: [],
      source: 'DEFAULT' as const,
    };
  }

  async listPincodes(organizationId: string, page: number, limit: number) {
    const result = await pincodePerformanceRepository.findAll(organizationId, page, limit);
    return {
      data: result.data.map((r) => this.mapRecord(r)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page * result.limit < result.total,
        hasPrev: result.page > 1,
      },
    };
  }

  private mapRecord(record: {
    pincode: string;
    city: string;
    state: string;
    tier: string;
    metrics: { riskScore: number; successRate: number; rtoRate: number; avgDeliveryDays: number };
    bestCourier: string | null;
    worstCourier: string | null;
    courierBreakdown: unknown[];
    trend: unknown[];
  }) {
    return {
      pincode: record.pincode,
      city: record.city,
      state: record.state,
      tier: record.tier,
      riskScore: record.metrics.riskScore,
      successRate: record.metrics.successRate,
      rtoRate: record.metrics.rtoRate,
      avgDeliveryDays: record.metrics.avgDeliveryDays,
      bestCourier: record.bestCourier,
      worstCourier: record.worstCourier,
      courierBreakdown: record.courierBreakdown,
      trend: record.trend,
      source: 'DATABASE' as const,
    };
  }
}

export const pincodeService = new PincodeService();
