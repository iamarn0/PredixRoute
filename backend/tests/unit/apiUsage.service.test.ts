import { ApiUsageService } from '../../src/services/apiUsage.service';

jest.mock('../../src/config/redis', () => {
  const store = new Map<string, string>();
  return {
    getRedis: () => ({
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      incr: jest.fn(async (key: string) => {
        const next = Number(store.get(key) ?? 0) + 1;
        store.set(key, String(next));
        return next;
      }),
      expire: jest.fn(),
    }),
  };
});

jest.mock('../../src/repositories/apiSubscription.repository', () => ({
  apiSubscriptionRepository: {
    findByOrganization: jest.fn().mockResolvedValue(null),
  },
}));

describe('ApiUsageService', () => {
  const service = new ApiUsageService();

  it('rejects when monthly quota exceeded', async () => {
    const { getRedis } = require('../../src/config/redis');
    const redis = getRedis();
    const month = new Date().toISOString().slice(0, 7);
    await redis.set(`apiusage:monthly:org1:${month}`, '10000');
    await expect(service.checkMonthlyQuota('org1')).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  });
});
