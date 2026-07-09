import { pincodePerformanceRepository } from '../repositories/pincodePerformance.repository';
import { ApiError } from '../utils/apiError';

const PINCODE_META: Record<string, { city: string; state: string; tier: 'METRO' | 'TIER1' | 'TIER2' | 'TIER3' | 'RURAL' }> = {
  '110001': { city: 'New Delhi', state: 'Delhi', tier: 'METRO' },
  '400001': { city: 'Mumbai', state: 'Maharashtra', tier: 'METRO' },
  '560001': { city: 'Bengaluru', state: 'Karnataka', tier: 'METRO' },
  '700001': { city: 'Kolkata', state: 'West Bengal', tier: 'METRO' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', tier: 'METRO' },
  '845401': { city: 'Motihari', state: 'Bihar', tier: 'RURAL' },
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
    return {
      pincode,
      city: meta.city,
      state: meta.state,
      tier: meta.tier,
      riskScore: 45,
      successRate: 0.85,
      rtoRate: 0.15,
      avgDeliveryDays: 4.0,
      bestCourier: null,
      worstCourier: null,
      courierBreakdown: [],
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
