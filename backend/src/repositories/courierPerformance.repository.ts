import { Types } from 'mongoose';
import { CourierPerformanceModel, ICourierPerformance } from '../models/courierPerformance.model';

export class CourierPerformanceRepository {
  async findByCourier(
    organizationId: string,
    courierCode: string,
    period = 'ALL_TIME',
  ): Promise<ICourierPerformance | null> {
    return CourierPerformanceModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      courierCode: courierCode.toLowerCase(),
      period,
    }).lean() as Promise<ICourierPerformance | null>;
  }

  async findAll(organizationId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { organizationId: new Types.ObjectId(organizationId), period: 'ALL_TIME' };

    const [data, total] = await Promise.all([
      CourierPerformanceModel.find(filter).sort({ 'metrics.successRate': -1 }).skip(skip).limit(limit).lean(),
      CourierPerformanceModel.countDocuments(filter),
    ]);

    return { data: data as unknown as ICourierPerformance[], total, page, limit };
  }
}

export const courierPerformanceRepository = new CourierPerformanceRepository();
