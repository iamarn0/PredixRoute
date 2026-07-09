import { courierPerformanceRepository } from '../repositories/courierPerformance.repository';
import { ApiError } from '../utils/apiError';

const COURIER_NAMES: Record<string, string> = {
  delhivery: 'Delhivery',
  bluedart: 'Blue Dart',
  dtdc: 'DTDC',
  ecom_express: 'Ecom Express',
};

export class CourierService {
  async getIntelligence(organizationId: string, courierCode: string) {
    const code = courierCode.toLowerCase().trim();
    if (!code) {
      throw ApiError.badRequest('INVALID_COURIER', 'Courier code is required');
    }

    const record = await courierPerformanceRepository.findByCourier(organizationId, code);
    if (record) {
      return this.mapRecord(record);
    }

    return {
      courierCode: code,
      courierName: COURIER_NAMES[code] ?? code,
      successRate: 0.85,
      rtoRate: 0.15,
      avgDeliveryDays: 4.0,
      p90DeliveryDays: 6.0,
      codSuccessRate: 0.82,
      avgCostPerKg: 45,
      trend: [],
      topPincodes: [],
      worstPincodes: [],
      source: 'DEFAULT' as const,
    };
  }

  async listCouriers(organizationId: string, page: number, limit: number) {
    const result = await courierPerformanceRepository.findAll(organizationId, page, limit);
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
    courierCode: string;
    courierName: string;
    metrics: {
      successRate: number;
      rtoRate: number;
      avgDeliveryDays: number;
      p90DeliveryDays: number;
      codSuccessRate: number;
      avgCostPerKg: number;
    };
    trend: unknown[];
    topPincodes: unknown[];
    worstPincodes: unknown[];
  }) {
    return {
      courierCode: record.courierCode,
      courierName: record.courierName,
      successRate: record.metrics.successRate,
      rtoRate: record.metrics.rtoRate,
      avgDeliveryDays: record.metrics.avgDeliveryDays,
      p90DeliveryDays: record.metrics.p90DeliveryDays,
      codSuccessRate: record.metrics.codSuccessRate,
      avgCostPerKg: record.metrics.avgCostPerKg,
      trend: record.trend,
      topPincodes: record.topPincodes,
      worstPincodes: record.worstPincodes,
      source: 'DATABASE' as const,
    };
  }
}

export const courierService = new CourierService();
