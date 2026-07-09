import { Types } from 'mongoose';
import { BulkPredictionJobModel, IBulkPredictionJob } from '../models/bulkPredictionJob.model';

export class BulkPredictionJobRepository {
  async create(data: Partial<IBulkPredictionJob>): Promise<IBulkPredictionJob> {
    const doc = await BulkPredictionJobModel.create(data);
    return doc.toObject() as IBulkPredictionJob;
  }

  async findByPublicId(organizationId: string, publicId: string): Promise<IBulkPredictionJob | null> {
    return BulkPredictionJobModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      publicId,
    }).lean() as Promise<IBulkPredictionJob | null>;
  }

  async listByOrganization(organizationId: string, page: number, limit: number) {
    const filter = { organizationId: new Types.ObjectId(organizationId) };
    const [data, total] = await Promise.all([
      BulkPredictionJobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BulkPredictionJobModel.countDocuments(filter),
    ]);
    return { data: data as unknown as IBulkPredictionJob[], total, page, limit };
  }

  async updateById(id: string, updates: Partial<IBulkPredictionJob>): Promise<IBulkPredictionJob | null> {
    return BulkPredictionJobModel.findByIdAndUpdate(id, updates, { new: true }).lean() as Promise<IBulkPredictionJob | null>;
  }
}

export const bulkPredictionJobRepository = new BulkPredictionJobRepository();
