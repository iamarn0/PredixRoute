import axios from 'axios';
import { z } from 'zod';
import { config, isOpenAiConfigured } from '../config';
import {
  CodVerificationAiAction,
  CodVerificationAiIntent,
} from '../types/codVerification.types';
import { ShapExplanation } from '../types/prediction.types';
import logger from '../utils/logger';

const aiResponseSchema = z.object({
  intent: z.enum(['CONFIRM', 'REJECT', 'FIX_ADDRESS', 'UNCLEAR', 'PREPAID_INTEREST', 'ABUSE']),
  confidence: z.number().min(0).max(1),
  replyEn: z.string().min(1).max(320),
  action: z.enum(['CONFIRM_ORDER', 'REJECT_ORDER', 'ASK_ADDRESS', 'WAIT', 'ESCALATE']),
  extracted: z
    .object({
      pincode: z.string().regex(/^\d{6}$/).optional(),
      landmark: z.string().max(200).optional(),
    })
    .default({}),
});

export type CodVerificationAiResult = z.infer<typeof aiResponseSchema>;

export interface CodVerificationAiContext {
  customerName: string;
  externalRef?: string;
  productName?: string;
  codAmount: number;
  orderValue: number;
  destinationPincode: string;
  riskLevel: string;
  riskScore: number;
  explanations: ShapExplanation[];
  recentMessages: Array<{ direction: 'INBOUND' | 'OUTBOUND'; body: string }>;
  turnsRemaining: number;
  inboundText: string;
}

const FALLBACK_REPLY =
  'Please reply YES to confirm your COD order or NO to cancel. You can also tell us if your delivery address needs correction.';

export class CodVerificationAiService {
  async processInbound(context: CodVerificationAiContext): Promise<CodVerificationAiResult> {
    const stopWords = ['stop', 'unsubscribe', 'opt out'];
    if (stopWords.some((w) => context.inboundText.toLowerCase().includes(w))) {
      return {
        intent: 'REJECT',
        confidence: 1,
        replyEn: 'You have opted out. Your order will not be shipped. Contact the seller if this was a mistake.',
        action: 'REJECT_ORDER',
        extracted: {},
      };
    }

    const quick = this.tryQuickIntent(context.inboundText);
    if (quick) return quick;

    if (!isOpenAiConfigured()) {
      return this.fallbackResult();
    }

    try {
      const systemPrompt = [
        'You are PredixRoute COD verification assistant. Always respond in English only.',
        'Understand Hindi/Hinglish customer replies but reply in English.',
        'Never invent discounts, delivery dates, or payment links.',
        'Confirm only when customer clearly wants the order.',
        'Return strict JSON with keys: intent, confidence, replyEn, action, extracted.',
        'Actions: CONFIRM_ORDER, REJECT_ORDER, ASK_ADDRESS, WAIT, ESCALATE.',
        'Use CONFIRM_ORDER only for clear confirmation. Use REJECT_ORDER for clear cancellation.',
        'Use ASK_ADDRESS when address seems wrong and you need pincode or landmark.',
        'Use ESCALATE for abuse or after repeated unclear replies.',
      ].join(' ');

      const topExplanations = context.explanations
        .slice(0, 2)
        .map((e) => e.description)
        .join('; ');

      const userPrompt = JSON.stringify({
        order: {
          customerName: context.customerName,
          externalRef: context.externalRef,
          productName: context.productName,
          codAmount: context.codAmount,
          orderValue: context.orderValue,
          destinationPincode: context.destinationPincode,
          riskLevel: context.riskLevel,
          riskScore: context.riskScore,
          riskReasons: topExplanations,
        },
        turnsRemaining: context.turnsRemaining,
        recentMessages: context.recentMessages,
        inboundText: context.inboundText,
      });

      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.openai.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${config.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const content = data.choices?.[0]?.message?.content;
      if (!content) return this.fallbackResult();

      const parsed = aiResponseSchema.safeParse(JSON.parse(content));
      if (!parsed.success) {
        logger.warn(`COD AI JSON validation failed: ${parsed.error.message}`);
        return this.fallbackResult();
      }

      return this.applyGuardrails(parsed.data);
    } catch (err) {
      logger.warn(`COD AI call failed: ${String(err)}`);
      return this.fallbackResult();
    }
  }

  private tryQuickIntent(text: string): CodVerificationAiResult | null {
    const normalized = text.trim().toLowerCase();
    const confirmPatterns = /^(yes|y|ok|okay|confirm|haan|ha|sure|yep|yeah|bhej do|bhejdo)\b/;
    const rejectPatterns = /^(no|n|cancel|nahi|nah|stop|reject|mat bhejo)\b/;

    if (confirmPatterns.test(normalized)) {
      return {
        intent: 'CONFIRM',
        confidence: 0.95,
        replyEn: 'Thank you! Your COD order is confirmed and will be processed for shipping.',
        action: 'CONFIRM_ORDER',
        extracted: {},
      };
    }

    if (rejectPatterns.test(normalized)) {
      return {
        intent: 'REJECT',
        confidence: 0.95,
        replyEn: 'Your order has been cancelled as requested. You will not receive this shipment.',
        action: 'REJECT_ORDER',
        extracted: {},
      };
    }

    return null;
  }

  private applyGuardrails(result: CodVerificationAiResult): CodVerificationAiResult {
    let action = result.action;

    if (action === 'CONFIRM_ORDER' && (result.intent !== 'CONFIRM' || result.confidence < 0.85)) {
      action = 'WAIT';
    }

    if (result.intent === 'ABUSE') {
      action = 'ESCALATE';
    }

    if (result.intent === 'PREPAID_INTEREST') {
      action = 'WAIT';
    }

    return { ...result, action, replyEn: result.replyEn.slice(0, 320) };
  }

  private fallbackResult(): CodVerificationAiResult {
    return {
      intent: 'UNCLEAR',
      confidence: 0.5,
      replyEn: FALLBACK_REPLY,
      action: 'WAIT',
      extracted: {},
    };
  }
}

export const codVerificationAiService = new CodVerificationAiService();

export type { CodVerificationAiIntent, CodVerificationAiAction };
