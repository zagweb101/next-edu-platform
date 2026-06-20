/**
 * Redis client (singleton) — used by BullMQ queues and rate limiter
 * Falls back gracefully when REDIS_URL is not configured (skips queue jobs).
 */
import IORedis, { type Redis } from 'ioredis';
import { logger } from '@/lib/logger';

declare global {
  var __redis: Redis | undefined;
}

let connection: Redis | null = null;
let isConfigured = false;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    if (!isConfigured) {
      logger.warn('REDIS_URL not set — BullMQ queues will be disabled');
      isConfigured = true;
    }
    return null;
  }

  if (!global.__redis) {
    global.__redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
    });
    global.__redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });
    global.__redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  connection = global.__redis;
  return connection;
}

export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}
