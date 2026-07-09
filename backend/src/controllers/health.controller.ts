import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { getRedis } from '../config/redis';
import { aiOrchestratorService } from '../services/aiOrchestrator.service';
import { sendSuccess } from '../utils/apiResponse';

export class HealthController {
  check = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const checks: Record<string, { status: string; latencyMs?: number }> = {};

      const mongoStart = Date.now();
      checks.mongodb = {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - mongoStart,
      };

      const redisStart = Date.now();
      try {
        const pong = await getRedis().ping();
        checks.redis = { status: pong === 'PONG' ? 'healthy' : 'unhealthy', latencyMs: Date.now() - redisStart };
      } catch {
        checks.redis = { status: 'unhealthy', latencyMs: Date.now() - redisStart };
      }

      const aiStart = Date.now();
      const aiHealthy = await aiOrchestratorService.healthCheck();
      checks.aiService = { status: aiHealthy ? 'healthy' : 'unhealthy', latencyMs: Date.now() - aiStart };

      const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
      const statusCode = allHealthy ? 200 : 503;

      sendSuccess(res, { status: allHealthy ? 'healthy' : 'degraded', checks, service: 'predixroute-backend' }, statusCode);
    } catch (err) {
      next(err);
    }
  };
}

export const healthController = new HealthController();
