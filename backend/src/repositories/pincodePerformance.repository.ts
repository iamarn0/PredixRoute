import { Types } from 'mongoose';
import { PincodePerformanceModel, IPincodePerformance } from '../models/pincodePerformance.model';

export class PincodePerformanceRepository {
  async findByPincode(
    organizationId: string,
    pincode: string,
    period = 'ALL_TIME',
  ): Promise<IPincodePerformance | null> {
    return PincodePerformanceModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      pincode,
      period,
    }).lean() as Promise<IPincodePerformance | null>;
  }

  async findAll(
    organizationId: string,
    page: number,
    limit: number,
    sortBy = 'metrics.riskScore',
    order: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: order === 'desc' ? -1 : 1 };
    const filter = { organizationId: new Types.ObjectId(organizationId), period: 'ALL_TIME' };

    const [data, total] = await Promise.all([
      PincodePerformanceModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      PincodePerformanceModel.countDocuments(filter),
    ]);

    return { data: data as unknown as IPincodePerformance[], total, page, limit };
  }
}

export const pincodePerformanceRepository = new PincodePerformanceRepository();
