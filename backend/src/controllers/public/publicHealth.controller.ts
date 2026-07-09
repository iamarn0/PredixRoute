import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { getRedis } from '../../config/redis';
import { aiOrchestratorService } from '../../services/aiOrchestrator.service';
import { sendSuccess } from '../../utils/apiResponse';

const APP_VERSION = '1.0.0';

export class PublicHealthController {
  health = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [mongoOk, redisOk, aiOk] = await Promise.all([
        mongoose.connection.readyState === 1,
        getRedis()
          .ping()
          .then(() => true)
          .catch(() => false),
        aiOrchestratorService.healthCheck(),
      ]);

      const services = {
        database: mongoOk ? 'healthy' : 'unhealthy',
        redis: redisOk ? 'healthy' : 'unhealthy',
        aiService: aiOk ? 'healthy' : 'degraded',
      };

      const overall = Object.values(services).every((s) => s === 'healthy')
        ? 'healthy'
        : Object.values(services).some((s) => s === 'unhealthy')
          ? 'unhealthy'
          : 'degraded';

      const statusCode = overall === 'unhealthy' ? 503 : 200;

      sendSuccess(
        res,
        {
          status: overall,
          version: APP_VERSION,
          timestamp: new Date().toISOString(),
          services,
        },
        statusCode,
      );
    } catch (err) {
      next(err);
    }
  };
}

export const publicHealthController = new PublicHealthController();
