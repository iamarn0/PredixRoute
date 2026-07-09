import { ApiPlanModel, IApiPlan } from '../models/apiPlan.model';

export class ApiPlanRepository {
  async findBySlug(slug: string): Promise<IApiPlan | null> {
    return ApiPlanModel.findOne({ slug, isActive: true }).lean() as Promise<IApiPlan | null>;
  }

  async findById(id: string): Promise<IApiPlan | null> {
    return ApiPlanModel.findById(id).lean() as Promise<IApiPlan | null>;
  }
}

export const apiPlanRepository = new ApiPlanRepository();
