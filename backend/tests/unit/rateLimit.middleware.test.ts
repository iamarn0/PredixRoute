import { authRateLimitMiddleware } from '../../src/middleware/rateLimit.middleware';
import { ApiError } from '../../src/utils/apiError';

const incrMock = jest.fn().mockResolvedValue(1);
const expireMock = jest.fn().mockResolvedValue(1);

jest.mock('../../src/config/redis', () => ({
  getRedis: () => ({
    incr: (...args: unknown[]) => incrMock(...args),
    expire: (...args: unknown[]) => expireMock(...args),
  }),
}));

describe('authRateLimitMiddleware', () => {
  beforeEach(() => {
    incrMock.mockReset();
    incrMock.mockResolvedValue(1);
  });

  it('allows requests under the limit', async () => {
    const middleware = authRateLimitMiddleware(20);
    const next = jest.fn();
    await middleware(
      { ip: '127.0.0.1', body: { email: 'test@example.com' } } as never,
      {} as never,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks when limit exceeded', async () => {
    incrMock.mockResolvedValue(21);
    const middleware = authRateLimitMiddleware(20);
    const next = jest.fn();
    await middleware(
      { ip: '127.0.0.1', body: { email: 'test@example.com' } } as never,
      {} as never,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });
});
