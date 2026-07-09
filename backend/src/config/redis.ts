import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 15000,
      family: 4, // IPv4 — avoids Windows IPv6 issues with cloud Redis
    });

    redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redis.on('connect', () => logger.info('Redis connected'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (client.status === 'wait' || client.status === 'end') {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export const redisConnection = { host: new URL(config.redisUrl).hostname, port: Number(new URL(config.redisUrl).port) || 6379 };
