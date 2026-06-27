import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/db';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Ibadah API ready at ${env.SERVER_URL}${env.API_PREFIX}`);
  });

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err);
  process.exit(1);
});
