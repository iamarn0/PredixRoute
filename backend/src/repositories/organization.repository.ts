import { OrganizationModel, IOrganization } from '../models/organization.model';

const PLATFORM_ORG_SLUG = 'predixroute-platform';

export class OrganizationRepository {
  async create(data: Partial<IOrganization>): Promise<IOrganization> {
    const doc = await OrganizationModel.create(data);
    return doc.toObject();
  }

  async findById(id: string): Promise<IOrganization | null> {
    return OrganizationModel.findById(id).lean() as Promise<IOrganization | null>;
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return OrganizationModel.findOne({ slug, deletedAt: null }).lean() as Promise<IOrganization | null>;
  }

  async findByPublicId(publicId: string): Promise<IOrganization | null> {
    return OrganizationModel.findOne({ publicId, deletedAt: null }).lean() as Promise<IOrganization | null>;
  }

  async findAll(page: number, limit: number) {
    return this.findAllFiltered(undefined, undefined, page, limit);
  }

  async findAllFiltered(
    search?: string,
    status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED',
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {
      deletedAt: null,
      slug: { $ne: PLATFORM_ORG_SLUG },
    };
    if (status) filter.status = status;
    if (search?.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { slug: { $regex: term, $options: 'i' } },
        { billingEmail: { $regex: term, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      OrganizationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OrganizationModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async countByStatus(status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED') {
    return OrganizationModel.countDocuments({
      deletedAt: null,
      slug: { $ne: PLATFORM_ORG_SLUG },
      status,
    });
  }

  async countAll(): Promise<number> {
    return OrganizationModel.countDocuments({ deletedAt: null, slug: { $ne: PLATFORM_ORG_SLUG } });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED') {
    return OrganizationModel.findByIdAndUpdate(id, { status }, { new: true }).lean() as Promise<IOrganization | null>;
  }

  async updateProfile(
    id: string,
    updates: {
      name?: string;
      billingEmail?: string;
      settings?: Partial<IOrganization['settings']>;
    },
  ) {
    const $set: Record<string, unknown> = {};
    if (updates.name) $set.name = updates.name;
    if (updates.billingEmail) $set.billingEmail = updates.billingEmail;
    if (updates.settings) {
      for (const [key, value] of Object.entries(updates.settings)) {
        if (value === undefined) continue;
        if (key === 'codVerification' && typeof value === 'object') {
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            if (nestedValue !== undefined) {
              $set[`settings.codVerification.${nestedKey}`] = nestedValue;
            }
          }
        } else {
          $set[`settings.${key}`] = value;
        }
      }
    }
    return OrganizationModel.findByIdAndUpdate(id, { $set }, { new: true }).lean() as Promise<IOrganization | null>;
  }
}

export const organizationRepository = new OrganizationRepository();
