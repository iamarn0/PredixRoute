import { ApiError } from '../utils/apiError';
import { codVerificationRepository } from '../repositories/codVerification.repository';
import { organizationRepository } from '../repositories/organization.repository';
import { predictionRepository } from '../repositories/prediction.repository';
import { webhookService } from './webhook.service';
import { codVerificationAiService } from './codVerificationAi.service';
import { twilioWhatsAppProvider } from './messaging/twilioWhatsApp.provider';
import { messagingQueue } from '../jobs/queues';
import { ICodVerification, CodVerificationModel } from '../models/codVerification.model';
import { IPrediction } from '../models/prediction.model';
import {
  ACTIVE_COD_VERIFICATION_STATUSES,
  CodVerificationSettings,
  CodVerificationStatus,
  DEFAULT_COD_VERIFICATION_SETTINGS,
} from '../types/codVerification.types';
import { ShapExplanation } from '../types/prediction.types';
import { maskPhone } from '../utils/phoneUtils';
import { config, isTwilioConfigured } from '../config';
import logger from '../utils/logger';

type WebhookTerminalEvent =
  | 'cod.verification.started'
  | 'cod.verification.confirmed'
  | 'cod.verification.rejected'
  | 'cod.verification.expired'
  | 'cod.verification.needs_review';

export class CodVerificationService {
  async getOrgSettings(organizationId: string): Promise<CodVerificationSettings> {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization');
    return {
      ...DEFAULT_COD_VERIFICATION_SETTINGS,
      ...(org.settings?.codVerification ?? {}),
    };
  }

  shouldTriggerForPrediction(
    prediction: IPrediction,
    settings: CodVerificationSettings,
  ): boolean {
    if (!settings.enabled) return false;
    if (!prediction.input.cod || !prediction.input.customerPhone) return false;
    if (!settings.riskLevels.includes(prediction.output.riskLevel)) return false;
    if (!isTwilioConfigured() && process.env.NODE_ENV === 'production') return false;
    return true;
  }

  async maybeStartFromPrediction(organizationId: string, prediction: IPrediction): Promise<void> {
    const settings = await this.getOrgSettings(organizationId);
    if (!this.shouldTriggerForPrediction(prediction, settings)) return;

    if (prediction.input.externalRef) {
      const existing = await codVerificationRepository.findActiveByExternalRef(
        organizationId,
        prediction.input.externalRef,
      );
      if (existing) return;
    }

    const existingPhone = await codVerificationRepository.findActiveByPhone(
      organizationId,
      prediction.input.customerPhone!,
    );
    if (existingPhone) return;

    await this.createSession(organizationId, {
      predictionId: prediction._id.toString(),
      predictionPublicId: prediction.publicId,
      externalRef: prediction.input.externalRef,
      customerPhone: prediction.input.customerPhone!,
      customerName: prediction.input.customerName || 'Customer',
      productName: prediction.input.productName,
      codAmount: prediction.input.codAmount ?? prediction.input.orderValue,
      orderValue: prediction.input.orderValue,
      destinationPincode: prediction.input.destinationPincode,
      riskLevelAtStart: prediction.output.riskLevel,
      settings,
      explanations: prediction.explanations as ShapExplanation[],
    });
  }

  async startManual(
    organizationId: string,
    input: {
      predictionId?: string;
      externalRef?: string;
      customerPhone?: string;
      customerName?: string;
      productName?: string;
      destinationPincode?: string;
      codAmount?: number;
      orderValue?: number;
    },
  ) {
    const settings = await this.getOrgSettings(organizationId);

    let prediction: IPrediction | null = null;
    if (input.predictionId) {
      prediction = await predictionRepository.findByPublicId(input.predictionId, organizationId);
      if (!prediction) throw ApiError.notFound('Prediction');
    }

    const customerPhone = input.customerPhone ?? prediction?.input.customerPhone;
    if (!customerPhone) {
      throw ApiError.badRequest('PHONE_REQUIRED', 'customerPhone is required to start verification');
    }

    if (input.externalRef ?? prediction?.input.externalRef) {
      const ref = input.externalRef ?? prediction?.input.externalRef!;
      const existing = await codVerificationRepository.findActiveByExternalRef(organizationId, ref);
      if (existing) throw ApiError.badRequest('ACTIVE_SESSION', 'An active verification already exists for this order');
    }

    return this.createSession(organizationId, {
      predictionId: prediction?._id.toString(),
      predictionPublicId: prediction?.publicId ?? 'manual',
      externalRef: input.externalRef ?? prediction?.input.externalRef,
      customerPhone,
      customerName: input.customerName ?? prediction?.input.customerName ?? 'Customer',
      productName: input.productName ?? prediction?.input.productName,
      codAmount:
        input.codAmount ??
        prediction?.input.codAmount ??
        prediction?.input.orderValue ??
        input.orderValue ??
        0,
      orderValue: input.orderValue ?? prediction?.input.orderValue ?? 0,
      destinationPincode:
        input.destinationPincode ?? prediction?.input.destinationPincode ?? '000000',
      riskLevelAtStart: prediction?.output.riskLevel ?? 'MEDIUM',
      settings,
      explanations: (prediction?.explanations as ShapExplanation[]) ?? [],
    });
  }

  private async createSession(
    organizationId: string,
    data: {
      predictionId?: string;
      predictionPublicId: string;
      externalRef?: string;
      customerPhone: string;
      customerName: string;
      productName?: string;
      codAmount: number;
      orderValue: number;
      destinationPincode: string;
      riskLevelAtStart: IPrediction['output']['riskLevel'];
      settings: CodVerificationSettings;
      explanations: ShapExplanation[];
    },
  ) {
    const expiresAt = new Date(Date.now() + data.settings.expiryHours * 60 * 60 * 1000);

    const session = await codVerificationRepository.create({
      organizationId,
      predictionId: data.predictionId,
      predictionPublicId: data.predictionPublicId,
      externalRef: data.externalRef,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      productName: data.productName,
      codAmount: data.codAmount,
      orderValue: data.orderValue,
      destinationPincode: data.destinationPincode,
      riskLevelAtStart: data.riskLevelAtStart,
      maxTurns: data.settings.maxTurns,
      expiresAt,
    });

    await messagingQueue.add(
      'send_opening',
      { verificationPublicId: session.publicId, organizationId },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    const delayMs = Math.max(expiresAt.getTime() - Date.now(), 1000);
    await messagingQueue.add(
      'expire_session',
      { verificationPublicId: session.publicId, organizationId },
      { delay: delayMs, attempts: 2 },
    );

    void this.dispatchWebhook(organizationId, 'cod.verification.started', session).catch(() => {});

    return this.mapToPublic(session, true);
  }

  async sendOpening(verificationPublicId: string, organizationId: string): Promise<void> {
    const session = await codVerificationRepository.findByPublicId(verificationPublicId, organizationId);
    if (!session || session.status !== 'PENDING') return;

    const externalRef = session.externalRef || session.predictionPublicId;
    const result = await twilioWhatsAppProvider.sendOpeningTemplate(session.customerPhone, {
      customerName: session.customerName,
      externalRef,
      codAmount: String(session.codAmount),
    });

    const openingBody = `Hi ${session.customerName}, please confirm your COD order ${externalRef} for ₹${session.codAmount}. Reply YES to confirm, NO to cancel, or tell us if your delivery address needs correction.`;

    await codVerificationRepository.appendMessage(verificationPublicId, organizationId, {
      direction: 'OUTBOUND',
      body: openingBody,
      createdAt: new Date(),
    });

    await codVerificationRepository.updateSession(verificationPublicId, organizationId, {
      status: 'SENT',
      lastOutboundMessageSid: result.messageSid,
    });
  }

  async sendReply(verificationPublicId: string, organizationId: string, body: string): Promise<void> {
    const session = await codVerificationRepository.findByPublicId(verificationPublicId, organizationId);
    if (!session) return;

    const sid = await twilioWhatsAppProvider.sendSessionMessage(session.customerPhone, body);

    await codVerificationRepository.appendMessage(verificationPublicId, organizationId, {
      direction: 'OUTBOUND',
      body,
      createdAt: new Date(),
    });

    await codVerificationRepository.updateSession(verificationPublicId, organizationId, {
      lastOutboundMessageSid: sid,
    });
  }

  async handleInbound(customerPhone: string, body: string): Promise<void> {
    const sessions = await this.findActiveSessionsByPhone(customerPhone);
    if (sessions.length === 0) {
      logger.info(`No active COD verification for ${maskPhone(customerPhone)}`);
      return;
    }

    const session = sessions[0];
    const organizationId = session.organizationId.toString();

    if (new Date() > new Date(session.expiresAt)) {
      await this.markExpired(session.publicId, organizationId, 'Verification window expired');
      return;
    }

    if (!ACTIVE_COD_VERIFICATION_STATUSES.includes(session.status)) return;

    await codVerificationRepository.appendMessage(session.publicId, organizationId, {
      direction: 'INBOUND',
      body,
      createdAt: new Date(),
    });

    const updated = await codVerificationRepository.findByPublicId(session.publicId, organizationId);
    if (!updated) return;

    const newTurnCount = updated.turnCount + 1;
    const turnsRemaining = Math.max(updated.maxTurns - newTurnCount, 0);

    let prediction: IPrediction | null = null;
    if (updated.predictionPublicId && updated.predictionPublicId !== 'manual') {
      prediction = await predictionRepository.findByPublicId(updated.predictionPublicId, organizationId);
    }

    const aiResult = await codVerificationAiService.processInbound({
      customerName: updated.customerName,
      externalRef: updated.externalRef,
      productName: updated.productName,
      codAmount: updated.codAmount,
      orderValue: updated.orderValue,
      destinationPincode: updated.destinationPincode,
      riskLevel: updated.riskLevelAtStart,
      riskScore: prediction?.output.riskScore ?? 0,
      explanations: (prediction?.explanations as ShapExplanation[]) ?? [],
      recentMessages: updated.messages.slice(-6).map((m) => ({
        direction: m.direction,
        body: m.body,
      })),
      turnsRemaining,
      inboundText: body,
    });

    let action = aiResult.action;
    if (turnsRemaining <= 0 && action === 'WAIT') {
      action = 'ESCALATE';
    }

    if (action === 'CONFIRM_ORDER') {
      await this.markConfirmed(session.publicId, organizationId, aiResult.replyEn);
      return;
    }

    if (action === 'REJECT_ORDER') {
      await this.markRejected(session.publicId, organizationId, aiResult.replyEn, aiResult.intent);
      return;
    }

    if (action === 'ESCALATE') {
      await this.markNeedsReview(session.publicId, organizationId, aiResult.replyEn, 'Max turns reached or escalation');
      return;
    }

    const extractedUpdates: Record<string, string> = {};
    if (aiResult.extracted.pincode) extractedUpdates.extractedPincode = aiResult.extracted.pincode;
    if (aiResult.extracted.landmark) extractedUpdates.extractedLandmark = aiResult.extracted.landmark;

    await codVerificationRepository.updateSession(session.publicId, organizationId, {
      status: 'IN_PROGRESS',
      turnCount: newTurnCount,
      ...extractedUpdates,
    });

    await this.sendReply(session.publicId, organizationId, aiResult.replyEn);
  }

  async expireSession(verificationPublicId: string, organizationId: string): Promise<void> {
    const session = await codVerificationRepository.findByPublicId(verificationPublicId, organizationId);
    if (!session) return;
    if (['CONFIRMED', 'REJECTED', 'EXPIRED', 'NEEDS_REVIEW'].includes(session.status)) return;
    await this.markExpired(verificationPublicId, organizationId, 'No customer response within verification window');
  }

  private async markConfirmed(publicId: string, organizationId: string, replyEn: string) {
    await this.sendReply(publicId, organizationId, replyEn);
    const session = await codVerificationRepository.updateSession(publicId, organizationId, {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      terminalReason: 'Customer confirmed order',
    });
    if (session) {
      void this.dispatchWebhook(organizationId, 'cod.verification.confirmed', session).catch(() => {});
    }
    logger.info(`COD verification confirmed: ${publicId}`);
  }

  private async markRejected(
    publicId: string,
    organizationId: string,
    replyEn: string,
    intent: string,
  ) {
    await this.sendReply(publicId, organizationId, replyEn);
    const session = await codVerificationRepository.updateSession(publicId, organizationId, {
      status: 'REJECTED',
      rejectedAt: new Date(),
      terminalReason: intent === 'REJECT' ? 'Customer rejected order' : 'Customer opted out',
    });
    if (session) {
      void this.dispatchWebhook(organizationId, 'cod.verification.rejected', session).catch(() => {});
    }
  }

  private async markExpired(publicId: string, organizationId: string, reason: string) {
    const session = await codVerificationRepository.updateSession(publicId, organizationId, {
      status: 'EXPIRED',
      terminalReason: reason,
    });
    if (session) {
      void this.dispatchWebhook(organizationId, 'cod.verification.expired', session).catch(() => {});
    }
  }

  private async markNeedsReview(publicId: string, organizationId: string, replyEn: string, reason: string) {
    await this.sendReply(
      publicId,
      organizationId,
      `${replyEn} Our team will review this order before shipping.`,
    );
    const session = await codVerificationRepository.updateSession(publicId, organizationId, {
      status: 'NEEDS_REVIEW',
      terminalReason: reason,
    });
    if (session) {
      void this.dispatchWebhook(organizationId, 'cod.verification.needs_review', session).catch(() => {});
    }
  }

  private async findActiveSessionsByPhone(customerPhone: string): Promise<ICodVerification[]> {
    return CodVerificationModel.find({
      customerPhone,
      status: { $in: ACTIVE_COD_VERIFICATION_STATUSES },
    })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<ICodVerification[]>;
  }

  async list(organizationId: string, page: number, limit: number, status?: CodVerificationStatus) {
    const result = await codVerificationRepository.findAll(organizationId, page, limit, status);
    return {
      data: result.data.map((s) => this.mapToPublic(s, false)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page * result.limit < result.total,
        hasPrev: result.page > 1,
      },
    };
  }

  async getByPublicId(organizationId: string, publicId: string, includeFullPhone = false) {
    const session = await codVerificationRepository.findByPublicId(publicId, organizationId);
    if (!session) throw ApiError.notFound('COD verification');
    return this.mapToPublic(session, includeFullPhone);
  }

  getMessagingConfig() {
    const rawFrom = config.twilio.whatsappFrom || '';
    const normalized = rawFrom.replace(/^whatsapp:/i, '');
    const configured = isTwilioConfigured();
    const mode = !configured
      ? ('simulated' as const)
      : config.twilio.whatsappTemplateSid
        ? ('template' as const)
        : ('session' as const);

    return {
      isConfigured: configured,
      whatsappSender: normalized || null,
      whatsappSenderDisplay: normalized
        ? `WhatsApp ${normalized}`
        : 'Not configured — messages are simulated in development',
      businessName: 'PredixRoute COD Verify',
      mode,
      usesTemplate: Boolean(config.twilio.whatsappTemplateSid),
      inboundWebhookUrl: `${config.twilio.webhookBaseUrl}/api/v1/webhooks/twilio/whatsapp`,
      customerInstructions:
        'Customers receive WhatsApp from this number. They can reply YES to confirm, NO to cancel, or describe address corrections.',
    };
  }

  async resolveManually(
    organizationId: string,
    publicId: string,
    input: {
      action: 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW';
      note?: string;
      notifyCustomer?: boolean;
    },
  ) {
    const session = await codVerificationRepository.findByPublicId(publicId, organizationId);
    if (!session) throw ApiError.notFound('COD verification');

    if (['CONFIRMED', 'REJECTED', 'EXPIRED'].includes(session.status)) {
      throw ApiError.badRequest('SESSION_CLOSED', 'This verification session is already closed');
    }

    const noteSuffix = input.note?.trim() ? `: ${input.note.trim()}` : '';
    const notify = input.notifyCustomer ?? false;

    if (input.action === 'CONFIRM') {
      const reason = `Manually confirmed in dashboard${noteSuffix}`;
      if (notify) {
        await this.sendReply(
          publicId,
          organizationId,
          `Your COD order has been confirmed by our team. Thank you!`,
        );
      }
      const updated = await codVerificationRepository.updateSession(publicId, organizationId, {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        terminalReason: reason,
      });
      if (updated) {
        void this.dispatchWebhook(organizationId, 'cod.verification.confirmed', updated).catch(() => {});
      }
      return this.getByPublicId(organizationId, publicId, true);
    }

    if (input.action === 'REJECT') {
      const reason = `Manually rejected in dashboard${noteSuffix}`;
      if (notify) {
        await this.sendReply(
          publicId,
          organizationId,
          `Your COD order could not be confirmed and has been cancelled. Contact the seller if this is unexpected.`,
        );
      }
      const updated = await codVerificationRepository.updateSession(publicId, organizationId, {
        status: 'REJECTED',
        rejectedAt: new Date(),
        terminalReason: reason,
      });
      if (updated) {
        void this.dispatchWebhook(organizationId, 'cod.verification.rejected', updated).catch(() => {});
      }
      return this.getByPublicId(organizationId, publicId, true);
    }

    const reason = `Flagged for manual review${noteSuffix}`;
    if (notify) {
      await this.sendReply(
        publicId,
        organizationId,
        `We are reviewing your COD order details. Our team will update you shortly.`,
      );
    }
    const updated = await codVerificationRepository.updateSession(publicId, organizationId, {
      status: 'NEEDS_REVIEW',
      terminalReason: reason,
    });
    if (updated) {
      void this.dispatchWebhook(organizationId, 'cod.verification.needs_review', updated).catch(() => {});
    }
    return this.getByPublicId(organizationId, publicId, true);
  }

  private mapToPublic(session: ICodVerification, includeFullPhone: boolean) {
    return {
      verificationId: session.publicId,
      predictionId: session.predictionPublicId,
      externalRef: session.externalRef,
      customerPhone: includeFullPhone ? session.customerPhone : maskPhone(session.customerPhone),
      customerName: session.customerName,
      productName: session.productName,
      codAmount: session.codAmount,
      orderValue: session.orderValue,
      destinationPincode: session.destinationPincode,
      status: session.status,
      riskLevel: session.riskLevelAtStart,
      turnCount: session.turnCount,
      maxTurns: session.maxTurns,
      expiresAt: session.expiresAt.toISOString(),
      messages: session.messages.map((m) => ({
        direction: m.direction,
        body: m.body,
        aiIntent: m.aiIntent,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      })),
      terminalReason: session.terminalReason,
      confirmedAt: session.confirmedAt?.toISOString(),
      rejectedAt: session.rejectedAt?.toISOString(),
      extractedPincode: session.extractedPincode,
      extractedLandmark: session.extractedLandmark,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private async dispatchWebhook(
    organizationId: string,
    event: WebhookTerminalEvent,
    session: ICodVerification,
  ) {
    await webhookService.dispatch(organizationId, event, {
      verificationId: session.publicId,
      predictionId: session.predictionPublicId,
      externalRef: session.externalRef,
      status: session.status,
      customerPhone: session.customerPhone,
      riskLevel: session.riskLevelAtStart,
      confirmedAt: session.confirmedAt?.toISOString(),
      rejectedAt: session.rejectedAt?.toISOString(),
      terminalReason: session.terminalReason,
    });
  }
}

export const codVerificationService = new CodVerificationService();
