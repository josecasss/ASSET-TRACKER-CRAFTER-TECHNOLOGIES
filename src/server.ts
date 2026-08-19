import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

const server = app.listen(port, () => {
  const maskedDbUrl = (process.env.DATABASE_URL ?? '').replace(/:\/\/.*@/, '://***@');
  logger.info(
    {
      nodeVersion: process.version,
      env: process.env.NODE_ENV ?? 'development',
      port,
      databaseUrl: maskedDbUrl,
    },
    'Server started'
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
