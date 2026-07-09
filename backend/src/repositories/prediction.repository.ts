import { FilterQuery, Types } from 'mongoose';
import { PredictionModel, IPrediction } from '../models/prediction.model';
import { TenantScopedRepository } from './base.repository';

export class PredictionRepository extends TenantScopedRepository<IPrediction & { deletedAt?: null }> {
  constructor() {
    super(PredictionModel as never, 'prd');
  }

  protected scope(organizationId: string, filter: FilterQuery<IPrediction> = {}): FilterQuery<IPrediction> {
    return {
      ...filter,
      organizationId: new Types.ObjectId(organizationId),
    };
  }

  async createPrediction(
    organizationId: string,
    data: Omit<Partial<IPrediction>, 'organizationId' | 'publicId'>,
  ): Promise<IPrediction> {
    return this.create(data as Partial<IPrediction>, organizationId);
  }
}

export const predictionRepository = new PredictionRepository();
