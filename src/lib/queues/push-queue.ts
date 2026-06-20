/**
 * Push Queue (BullMQ) — async FCM push notifications
 */
import { Queue, Worker } from 'bullmq';
import { getRedis, isRedisAvailable } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { sendPush } from '@/lib/push';

export interface PushJob {
  tokens: string[];
  title: string;
  body: string;
  link?: string;
  data?: Record<string, string>;
}

const QUEUE_NAME = 'push';

let _queue: Queue<PushJob> | null = null;

function getQueue(): Queue<PushJob> | null {
  if (!isRedisAvailable()) return null;
  if (!_queue) {
    _queue = new Queue<PushJob>(QUEUE_NAME, {
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

export const pushQueue = {
  async add(name: string, data: PushJob) {
    const q = getQueue();
    if (!q) {
      logger.warn('Redis not available — sending push immediately');
      await sendPushImmediately(data);
      return null;
    }
    return q.add(name, data);
  },
};

let worker: Worker<PushJob> | null = null;

export function startPushWorker() {
  if (worker || !isRedisAvailable()) return null;
  worker = new Worker<PushJob>(
    QUEUE_NAME,
    async (job) => {
      const { tokens, title, body, link, data } = job.data;
      if (tokens.length === 0) return;
      await sendPush({ tokens, title, body, link, data });
    },
    { connection: getRedis()! },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Push job failed');
  });
  return worker;
}

export async function sendPushImmediately(data: PushJob) {
  try {
    await sendPush(data);
  } catch (err) {
    logger.error({ err }, 'Immediate push send failed');
  }
}
