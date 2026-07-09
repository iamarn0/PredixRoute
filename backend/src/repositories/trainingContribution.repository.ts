import { FilterQuery, Types } from 'mongoose';
import {
  TrainingContributionModel,
  ITrainingContribution,
  TrainingContributionStatus,
} from '../models/trainingContribution.model';

export class TrainingContributionRepository {
  async create(data: Partial<ITrainingContribution>): Promise<ITrainingContribution> {
    const doc = await TrainingContributionModel.create(data);
    return doc.toObject() as ITrainingContribution;
  }

  async findByPublicId(organizationId: string, publicId: string): Promise<ITrainingContribution | null> {
    return TrainingContributionModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      publicId,
    }).lean() as Promise<ITrainingContribution | null>;
  }

  async findByPublicIdAny(publicId: string): Promise<ITrainingContribution | null> {
    return TrainingContributionModel.findOne({ publicId }).lean() as Promise<ITrainingContribution | null>;
  }

  async listByOrganization(organizationId: string, page: number, limit: number) {
    const filter = { organizationId: new Types.ObjectId(organizationId) };
    const [data, total] = await Promise.all([
      TrainingContributionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TrainingContributionModel.countDocuments(filter),
    ]);
    return { data: data as unknown as ITrainingContribution[], total, page, limit };
  }

  async listByStatus(status: TrainingContributionStatus | TrainingContributionStatus[], page: number, limit: number) {
    const filter: FilterQuery<ITrainingContribution> = {
      status: Array.isArray(status) ? { $in: status } : status,
    };
    const [data, total] = await Promise.all([
      TrainingContributionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TrainingContributionModel.countDocuments(filter),
    ]);
    return { data: data as unknown as ITrainingContribution[], total, page, limit };
  }

  async updateById(id: string, updates: Partial<ITrainingContribution>): Promise<ITrainingContribution | null> {
    return TrainingContributionModel.findByIdAndUpdate(id, updates, { new: true }).lean() as Promise<ITrainingContribution | null>;
  }
}

export const trainingContributionRepository = new TrainingContributionRepository();
