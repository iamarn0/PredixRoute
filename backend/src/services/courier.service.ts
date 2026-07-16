import { courierPerformanceRepository } from '../repositories/courierPerformance.repository';
import { ApiError } from '../utils/apiError';

const COURIER_NAMES: Record<string, string> = {
  delhivery: 'Delhivery',
  bluedart: 'Blue Dart',
  dtdc: 'DTDC',
  ecom_express: 'Ecom Express',
};

const COURIER_DEFAULTS: Record<
  string,
  {
    successRate: number;
    rtoRate: number;
    avgDeliveryDays: number;
    p90DeliveryDays: number;
    codSuccessRate: number;
    avgCostPerKg: number;
  }
> = {
  delhivery: {
    successRate: 0.92,
    rtoRate: 0.08,
    avgDeliveryDays: 2.8,
    p90DeliveryDays: 5.2,
    codSuccessRate: 0.88,
    avgCostPerKg: 42,
  },
  bluedart: {
    successRate: 0.94,
    rtoRate: 0.06,
    avgDeliveryDays: 2.5,
    p90DeliveryDays: 4.8,
    codSuccessRate: 0.91,
    avgCostPerKg: 48,
  },
  dtdc: {
    successRate: 0.88,
    rtoRate: 0.12,
    avgDeliveryDays: 3.5,
    p90DeliveryDays: 7.0,
    codSuccessRate: 0.84,
    avgCostPerKg: 38,
  },
  ecom_express: {
    successRate: 0.9,
    rtoRate: 0.1,
    avgDeliveryDays: 3.0,
    p90DeliveryDays: 6.0,
    codSuccessRate: 0.86,
    avgCostPerKg: 40,
  },
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

    const defaults = COURIER_DEFAULTS[code] ?? {
      successRate: 0.85,
      rtoRate: 0.15,
      avgDeliveryDays: 4.0,
      p90DeliveryDays: 6.0,
      codSuccessRate: 0.82,
      avgCostPerKg: 45,
    };

    return {
      courierCode: code,
      courierName: COURIER_NAMES[code] ?? code,
      successRate: defaults.successRate,
      rtoRate: defaults.rtoRate,
      avgDeliveryDays: defaults.avgDeliveryDays,
      p90DeliveryDays: defaults.p90DeliveryDays,
      codSuccessRate: defaults.codSuccessRate,
      avgCostPerKg: defaults.avgCostPerKg,
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
