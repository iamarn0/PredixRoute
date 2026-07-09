import { Document, FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResult, PaginationOptions } from '../interfaces/repository.interface';
import { generatePublicId, PublicIdPrefix } from '../utils/idUtils';

export abstract class TenantScopedRepository<
  T extends Document & { organizationId: Types.ObjectId; deletedAt?: Date | null },
> {
  constructor(
    protected readonly model: Model<T>,
    protected readonly publicIdPrefix: PublicIdPrefix,
  ) {}

  protected scope(organizationId: string, filter: FilterQuery<T> = {}): FilterQuery<T> {
    return {
      ...filter,
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null,
    } as FilterQuery<T>;
  }

  async findById(id: string, organizationId: string): Promise<T | null> {
    return this.model.findOne(this.scope(organizationId, { _id: id } as FilterQuery<T>)).lean() as Promise<T | null>;
  }

  async findByPublicId(publicId: string, organizationId: string): Promise<T | null> {
    return this.model
      .findOne(this.scope(organizationId, { publicId } as FilterQuery<T>))
      .lean() as Promise<T | null>;
  }

  async findAll(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const filter = this.scope(organizationId);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: Partial<T>, organizationId: string): Promise<T> {
    const doc = await this.model.create({
      ...data,
      organizationId: new Types.ObjectId(organizationId),
      publicId: generatePublicId(this.publicIdPrefix),
    });
    return doc.toObject() as T;
  }

  async update(
    id: string,
    organizationId: string,
    data: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(this.scope(organizationId, { _id: id } as FilterQuery<T>), data, {
        new: true,
      })
      .lean() as Promise<T | null>;
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const result = await this.model.updateOne(
      this.scope(organizationId, { _id: id } as FilterQuery<T>),
      { deletedAt: new Date() },
    );
    return result.modifiedCount > 0;
  }
}
