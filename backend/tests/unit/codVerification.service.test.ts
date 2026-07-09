jest.mock('../../src/config', () => ({
  config: {
    env: 'test',
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    twilio: {
      accountSid: '',
      authToken: '',
      whatsappFrom: '',
      whatsappTemplateSid: '',
      webhookBaseUrl: 'http://localhost:3000',
    },
  },
  isOpenAiConfigured: () => false,
  isTwilioConfigured: () => false,
}));

import { codVerificationAiService } from '../../src/services/codVerificationAi.service';
import { CodVerificationService } from '../../src/services/codVerification.service';
import { DEFAULT_COD_VERIFICATION_SETTINGS } from '../../src/types/codVerification.types';
import { IPrediction } from '../../src/models/prediction.model';

describe('CodVerificationAiService', () => {
  const baseContext = {
    customerName: 'Rahul',
    externalRef: 'ORD-1',
    codAmount: 1499,
    orderValue: 1499,
    destinationPincode: '110001',
    riskLevel: 'HIGH',
    riskScore: 62,
    explanations: [],
    recentMessages: [],
    turnsRemaining: 3,
    inboundText: '',
  };

  it('classifies yes/haan as CONFIRM without OpenAI', async () => {
    const result = await codVerificationAiService.processInbound({
      ...baseContext,
      inboundText: 'haan bhej do',
    });
    expect(result.action).toBe('CONFIRM_ORDER');
    expect(result.intent).toBe('CONFIRM');
  });

  it('classifies no/cancel as REJECT without OpenAI', async () => {
    const result = await codVerificationAiService.processInbound({
      ...baseContext,
      inboundText: 'cancel order',
    });
    expect(result.action).toBe('REJECT_ORDER');
  });

  it('handles STOP as reject', async () => {
    const result = await codVerificationAiService.processInbound({
      ...baseContext,
      inboundText: 'STOP',
    });
    expect(result.action).toBe('REJECT_ORDER');
  });
});

describe('CodVerificationService trigger rules', () => {
  const service = new CodVerificationService();

  const basePrediction = {
    input: {
      cod: true,
      customerPhone: '+919876543210',
      customerName: 'Test',
    },
    output: { riskLevel: 'HIGH' },
  } as IPrediction;

  it('triggers for MEDIUM+ COD with phone when enabled', () => {
    expect(
      service.shouldTriggerForPrediction(basePrediction, DEFAULT_COD_VERIFICATION_SETTINGS),
    ).toBe(true);
  });

  it('does not trigger for LOW risk', () => {
    const low = { ...basePrediction, output: { riskLevel: 'LOW' } } as IPrediction;
    expect(service.shouldTriggerForPrediction(low, DEFAULT_COD_VERIFICATION_SETTINGS)).toBe(false);
  });

  it('does not trigger when disabled', () => {
    expect(
      service.shouldTriggerForPrediction(basePrediction, {
        ...DEFAULT_COD_VERIFICATION_SETTINGS,
        enabled: false,
      }),
    ).toBe(false);
  });

  it('does not trigger without phone', () => {
    const noPhone = {
      ...basePrediction,
      input: { ...basePrediction.input, customerPhone: undefined },
    } as IPrediction;
    expect(service.shouldTriggerForPrediction(noPhone, DEFAULT_COD_VERIFICATION_SETTINGS)).toBe(false);
  });
});
