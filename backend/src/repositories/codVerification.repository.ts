import { Types } from 'mongoose';
import {
  CodVerificationModel,
  ICodVerification,
} from '../models/codVerification.model';
import {
  ACTIVE_COD_VERIFICATION_STATUSES,
  CodVerificationMessage,
  CodVerificationStatus,
} from '../types/codVerification.types';
import { RiskLevel } from '../types/prediction.types';

export class CodVerificationRepository {
  async create(data: {
    organizationId: string;
    predictionId?: string;
    predictionPublicId: string;
    externalRef?: string;
    customerPhone: string;
    customerName: string;
    productName?: string;
    codAmount: number;
    orderValue: number;
    destinationPincode: string;
    riskLevelAtStart: RiskLevel;
    maxTurns: number;
    expiresAt: Date;
  }): Promise<ICodVerification> {
    const doc = await CodVerificationModel.create({
      organizationId: new Types.ObjectId(data.organizationId),
      ...(data.predictionId ? { predictionId: new Types.ObjectId(data.predictionId) } : {}),
      predictionPublicId: data.predictionPublicId,
      externalRef: data.externalRef,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      productName: data.productName,
      codAmount: data.codAmount,
      orderValue: data.orderValue,
      destinationPincode: data.destinationPincode,
      riskLevelAtStart: data.riskLevelAtStart,
      maxTurns: data.maxTurns,
      expiresAt: data.expiresAt,
      status: 'PENDING',
      turnCount: 0,
      messages: [],
    });
    return doc.toObject() as ICodVerification;
  }

  async findByPublicId(publicId: string, organizationId: string): Promise<ICodVerification | null> {
    return CodVerificationModel.findOne({
      publicId,
      organizationId: new Types.ObjectId(organizationId),
    }).lean() as Promise<ICodVerification | null>;
  }

  async findByPublicIdGlobal(publicId: string): Promise<ICodVerification | null> {
    return CodVerificationModel.findOne({ publicId }).lean() as Promise<ICodVerification | null>;
  }

  async findActiveByPhone(organizationId: string, customerPhone: string): Promise<ICodVerification | null> {
    return CodVerificationModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      customerPhone,
      status: { $in: ACTIVE_COD_VERIFICATION_STATUSES },
    })
      .sort({ createdAt: -1 })
      .lean() as Promise<ICodVerification | null>;
  }

  async findActiveByExternalRef(
    organizationId: string,
    externalRef: string,
  ): Promise<ICodVerification | null> {
    return CodVerificationModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      externalRef,
      status: { $in: ACTIVE_COD_VERIFICATION_STATUSES },
    }).lean() as Promise<ICodVerification | null>;
  }

  async findAll(organizationId: string, page: number, limit: number, status?: CodVerificationStatus) {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
    };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      CodVerificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CodVerificationModel.countDocuments(filter),
    ]);

    return { data: data as unknown as ICodVerification[], total, page, limit };
  }

  async appendMessage(
    publicId: string,
    organizationId: string,
    message: CodVerificationMessage,
  ): Promise<ICodVerification | null> {
    return CodVerificationModel.findOneAndUpdate(
      { publicId, organizationId: new Types.ObjectId(organizationId) },
      { $push: { messages: message } },
      { new: true },
    ).lean() as Promise<ICodVerification | null>;
  }

  async updateSession(
    publicId: string,
    organizationId: string,
    updates: Partial<
      Pick<
        ICodVerification,
        | 'status'
        | 'turnCount'
        | 'lastOutboundMessageSid'
        | 'extractedPincode'
        | 'extractedLandmark'
        | 'terminalReason'
        | 'confirmedAt'
        | 'rejectedAt'
      >
    >,
  ): Promise<ICodVerification | null> {
    return CodVerificationModel.findOneAndUpdate(
      { publicId, organizationId: new Types.ObjectId(organizationId) },
      { $set: updates },
      { new: true },
    ).lean() as Promise<ICodVerification | null>;
  }
}

export const codVerificationRepository = new CodVerificationRepository();
