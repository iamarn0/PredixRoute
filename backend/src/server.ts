import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import logger from './utils/logger';
import http from 'http';

async function bootstrap() {
  await connectDatabase();
  await connectRedis();
  const fs = await import('fs/promises');
  await fs.mkdir(config.datasetRoot, { recursive: true });

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`PredixRoute backend listening on port ${config.port} [${config.env}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully…`);
    server.close(async () => {
      await disconnectRedis();
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Failed to start server: ${String(err)}`);
  process.exit(1);
});
