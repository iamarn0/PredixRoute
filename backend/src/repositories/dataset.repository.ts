import { Types } from 'mongoose';
import { DatasetModel, IDataset, DatasetStatus } from '../models/dataset.model';

export class DatasetRepository {
  async create(data: Partial<IDataset>): Promise<IDataset> {
    const doc = await DatasetModel.create(data);
    return doc.toObject();
  }

  async findByPublicId(organizationId: string, publicId: string) {
    return DatasetModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      publicId,
    }).lean();
  }

  async listByOrganization(organizationId: string, page: number, limit: number) {
    const filter = { organizationId: new Types.ObjectId(organizationId) };
    const [data, total] = await Promise.all([
      DatasetModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      DatasetModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async updateById(id: string, updates: Partial<IDataset>) {
    return DatasetModel.findByIdAndUpdate(id, updates, { new: true }).lean();
  }

  async updateStatus(id: string, status: DatasetStatus, updates: Partial<IDataset> = {}) {
    return DatasetModel.findByIdAndUpdate(id, { status, ...updates }, { new: true }).lean();
  }

  async listAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      DatasetModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'organizations',
            localField: 'organizationId',
            foreignField: '_id',
            as: 'organization',
          },
        },
        { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
        { $match: { 'organization.slug': { $ne: 'predixroute-platform' } } },
        {
          $project: {
            publicId: 1,
            name: 1,
            description: 1,
            status: 1,
            originalFileName: 1,
            fileSizeBytes: 1,
            rowCount: 1,
            qualityScore: 1,
            qualityIssues: 1,
            columnMapping: 1,
            trainingMetrics: 1,
            errorMessage: 1,
            createdAt: 1,
            updatedAt: 1,
            organizationPublicId: '$organization.publicId',
            organizationName: '$organization.name',
          },
        },
      ]),
      DatasetModel.countDocuments(),
    ]);
    return { data: rows, total, page, limit };
  }
}

export const datasetRepository = new DatasetRepository();
