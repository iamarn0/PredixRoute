import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { ApiError } from '../utils/apiError';

const WINDOW_SECONDS = 3600;
const MAX_PER_IP = 20;

export async function demoRateLimitMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const redis = getRedis();
    const key = `rl:demo:ip:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    if (count > MAX_PER_IP) {
      throw ApiError.tooManyRequests('Demo rate limit exceeded. Register for full access.');
    }
    next();
  } catch (err) {
    next(err);
  }
}
