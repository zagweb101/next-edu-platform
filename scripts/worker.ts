/**
 * Background Worker — starts all BullMQ workers (email, push)
 * Run separately from the Next.js app:
 *   bun run worker:start
 *
 * On Railway, this becomes a separate "worker" service in railway.json
 * that shares the same codebase but runs this entrypoint.
 */
import { startEmailWorker } from '@/lib/queues/email-queue';
import { startPushWorker } from '@/lib/queues/push-queue';
import { logger } from '@/lib/logger';
import { isRedisAvailable } from '@/lib/redis';

async function main() {
  logger.info('Starting background worker process...');

  if (!isRedisAvailable()) {
    logger.error('REDIS_URL not set — worker cannot start');
    process.exit(1);
  }

  const emailWorker = startEmailWorker();
  const pushWorker = startPushWorker();

  if (!emailWorker && !pushWorker) {
    logger.error('No workers started — exiting');
    process.exit(1);
  }

  logger.info({ email: !!emailWorker, push: !!pushWorker }, 'Workers started');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down workers...');
    await Promise.allSettled([emailWorker?.close(), pushWorker?.close()]);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Worker fatal error');
  process.exit(1);
});
