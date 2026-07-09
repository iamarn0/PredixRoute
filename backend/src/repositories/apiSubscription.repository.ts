import { ApiSubscriptionModel, IApiSubscription } from '../models/apiSubscription.model';
import { Types } from 'mongoose';

export class ApiSubscriptionRepository {
  async create(data: Partial<IApiSubscription>): Promise<IApiSubscription> {
    const doc = await ApiSubscriptionModel.create(data);
    return doc.toObject();
  }

  async findByOrganization(organizationId: string): Promise<IApiSubscription | null> {
    return ApiSubscriptionModel.findOne({ organizationId: new Types.ObjectId(organizationId) }).lean() as Promise<IApiSubscription | null>;
  }

  async findWithPlanByOrganization(organizationId: string) {
    const rows = await ApiSubscriptionModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      {
        $lookup: {
          from: 'apiplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          status: 1,
          billingCycle: 1,
          currentPeriodStart: 1,
          currentPeriodEnd: 1,
          trialEndsAt: 1,
          planName: '$plan.name',
          planSlug: '$plan.slug',
        },
      },
    ]);
    return rows[0] ?? null;
  }
}

export const apiSubscriptionRepository = new ApiSubscriptionRepository();
