import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { ApiError } from '../utils/apiError';

async function incrementWindow(key: string, windowSeconds: number, max: number) {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  if (count > max) {
    throw ApiError.tooManyRequests('Too many requests. Please try again later.');
  }
}

export function authRateLimitMiddleware(maxPer15Min = 20) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const ip = req.ip ?? 'unknown';
      const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'anonymous';
      await incrementWindow(`rl:auth:ip:${ip}`, 900, maxPer15Min);
      await incrementWindow(`rl:auth:email:${email}`, 900, maxPer15Min);
      next();
    } catch (err) {
      next(err);
    }
  };
}
