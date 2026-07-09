import { UserModel, IUser } from '../models/user.model';
import { Types } from 'mongoose';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    const doc = await UserModel.create(data);
    return doc.toObject();
  }

  async findByEmail(organizationId: string, email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ organizationId, email: email.toLowerCase(), deletedAt: null });
    if (includePassword) query.select('+passwordHash');
    return query.lean() as Promise<IUser | null>;
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).lean() as Promise<IUser | null>;
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).lean() as Promise<IUser | null>;
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordHash')
      .lean() as Promise<IUser | null>;
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<IUser | null>;
  }

  async findByEmailGlobal(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (includePassword) query.select('+passwordHash');
    return query.lean() as Promise<IUser | null>;
  }

  async findAllAdmin(
    page: number,
    limit: number,
    search?: string,
    organizationId?: string,
  ) {
    const match: Record<string, unknown> = { deletedAt: null };
    if (organizationId) match.organizationId = new Types.ObjectId(organizationId);
    if (search?.trim()) {
      const term = search.trim();
      match.$or = [
        { email: { $regex: term, $options: 'i' } },
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      UserModel.aggregate([
        { $match: match },
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
        {
          $project: {
            publicId: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            role: 1,
            status: 1,
            lastLoginAt: 1,
            createdAt: 1,
            organizationId: 1,
            organizationName: '$organization.name',
            organizationSlug: '$organization.slug',
          },
        },
      ]),
      UserModel.countDocuments(match),
    ]);

    return { data: rows, total, page, limit };
  }
}

export const userRepository = new UserRepository();
