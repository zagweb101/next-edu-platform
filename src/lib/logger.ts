/**
 * Logger — Pino-based structured logging
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ err }, 'Failed to send email');
 */
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: {
    service: process.env.NEXT_PUBLIC_APP_NAME || 'next-boilerplate',
    env: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.AUTH_SECRET',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers?.['user-agent'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export type Logger = typeof logger;

/**
 * Create a child logger with additional context.
 * Useful for request-scoped logging.
 */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
