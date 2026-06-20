/**
 * Email Queue (BullMQ) — async email sending via Resend
 * Falls back to immediate sending when Redis is unavailable.
 */
import { Queue, Worker } from 'bullmq';
import { getRedis, isRedisAvailable } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

export interface EmailJob {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
  userName?: string;
  locale?: string;
  template?: 'notification' | 'welcome' | 'reset-password' | 'verify-email';
}

const QUEUE_NAME = 'email';

// Lazily create the queue — only when Redis is configured.
// Otherwise, calling code should fall back to sendEmailImmediately().
let _queue: Queue<EmailJob> | null = null;

function getQueue(): Queue<EmailJob> | null {
  if (!isRedisAvailable()) return null;
  if (!_queue) {
    _queue = new Queue<EmailJob>(QUEUE_NAME, {
      connection: getRedis()!,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return _queue;
}

// Backwards-compatible export — callers can `await emailQueue.add(...)`.
// When Redis is unavailable, this becomes a no-op queue that logs a warning.
export const emailQueue = {
  async add(name: string, data: EmailJob) {
    const q = getQueue();
    if (!q) {
      logger.warn('Redis not available — sending email immediately');
      await sendEmailImmediately(data);
      return null;
    }
    return q.add(name, data);
  },
};

// Worker should only be started in a long-running process (not serverless).
// For Railway, start the worker as a separate process via `bun run worker`.
let worker: Worker<EmailJob> | null = null;

export function startEmailWorker() {
  if (worker || !isRedisAvailable()) return null;
  worker = new Worker<EmailJob>(
    QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, to: job.data.to }, 'Sending email');
      await sendEmail(job.data);
    },
    { connection: getRedis()! },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Email job failed');
  });
  return worker;
}

/** Fallback for environments without Redis — send immediately */
export async function sendEmailImmediately(data: EmailJob) {
  try {
    await sendEmail(data);
  } catch (err) {
    logger.error({ err, to: data.to }, 'Immediate email send failed');
  }
}
