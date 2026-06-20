/**
 * Notification Service — In-app + Email + Push
 *
 * Three delivery channels:
 *   1. IN_APP — stored in DB, shown in notification center (bell icon)
 *   2. EMAIL  — sent via Resend, queued in BullMQ
 *   3. PUSH   — sent via Firebase Cloud Messaging (FCM)
 *
 * Usage:
 *   import { notify } from '@/lib/notifications';
 *   await notify.send({
 *     userId: 'xxx',
 *     title: 'Payment received',
 *     body: 'Your order #123 has been paid',
 *     channels: ['IN_APP', 'EMAIL'],
 *   });
 */
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { emailQueue, sendEmailImmediately } from '@/lib/queues/email-queue';
import { pushQueue, sendPushImmediately } from '@/lib/queues/push-queue';
import { isRedisAvailable } from '@/lib/redis';
import type { NotificationChannel, NotificationStatus } from '@prisma/client';

export interface NotifyInput {
  userId: string;
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  channels?: NotificationChannel[]; // default: based on user prefs
  metadata?: Record<string, unknown>;
}

export const notify = {
  /**
   * Send a notification across one or more channels.
   * If channels is omitted, uses user's preferences (notifyInApp / notifyEmail / notifyPush).
   */
  async send(input: NotifyInput) {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        notifyInApp: true,
        notifyEmail: true,
        notifyPush: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      logger.warn({ userId: input.userId }, 'notify.send: user not found or inactive');
      return null;
    }

    const channels = input.channels ?? this.resolveChannels(user);
    const results: Record<string, NotificationStatus> = {};

    for (const channel of channels) {
      // Always create the in-app notification record (it's the source of truth)
      if (channel === 'IN_APP') {
        const notif = await db.notification.create({
          data: {
            userId: user.id,
            title: input.title,
            body: input.body,
            type: input.type ?? 'info',
            link: input.link,
            channel: 'IN_APP',
            status: 'DELIVERED',
            metadata: input.metadata ?? undefined,
          },
        });
        results.IN_APP = 'DELIVERED';
        logger.debug({ notifId: notif.id, userId: user.id }, 'In-app notification created');
      }

      if (channel === 'EMAIL') {
        if (isRedisAvailable()) {
          await emailQueue.add('send', {
            to: user.email,
            subject: input.title,
            title: input.title,
            body: input.body,
            link: input.link,
            userName: user.name ?? undefined,
            locale: user.locale,
          });
          results.EMAIL = 'PENDING';
        } else {
          await sendEmailImmediately({
            to: user.email,
            subject: input.title,
            title: input.title,
            body: input.body,
            link: input.link,
            userName: user.name ?? undefined,
            locale: user.locale,
          });
          results.EMAIL = 'SENT';
        }
        await db.notification.create({
          data: {
            userId: user.id,
            title: input.title,
            body: input.body,
            type: input.type ?? 'info',
            link: input.link,
            channel: 'EMAIL',
            status: results.EMAIL,
            metadata: input.metadata ?? undefined,
          },
        });
      }

      if (channel === 'PUSH') {
        const tokens = await db.fcmToken.findMany({
          where: { userId: user.id, isActive: true },
          select: { token: true },
        });
        if (tokens.length === 0) {
          results.PUSH = 'FAILED';
          continue;
        }
        if (isRedisAvailable()) {
          await pushQueue.add('send', {
            tokens: tokens.map((t) => t.token),
            title: input.title,
            body: input.body,
            link: input.link,
          });
          results.PUSH = 'PENDING';
        } else {
          await sendPushImmediately({
            tokens: tokens.map((t) => t.token),
            title: input.title,
            body: input.body,
            link: input.link,
          });
          results.PUSH = 'SENT';
        }
      }
    }

    logger.info({ userId: user.id, channels: results }, 'Notification dispatched');
    return results;
  },

  resolveChannels(user: { notifyInApp: boolean; notifyEmail: boolean; notifyPush: boolean }): NotificationChannel[] {
    const ch: NotificationChannel[] = [];
    if (user.notifyInApp) ch.push('IN_APP');
    if (user.notifyEmail) ch.push('EMAIL');
    if (user.notifyPush) ch.push('PUSH');
    return ch;
  },

  /** Mark an in-app notification as read */
  async markRead(notificationId: string, userId: string) {
    return db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, status: { not: 'READ' }, channel: 'IN_APP' },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  /** List in-app notifications for a user */
  async list(userId: string, opts: { limit?: number; cursor?: string; unreadOnly?: boolean } = {}) {
    const { limit = 20, cursor, unreadOnly } = opts;
    return db.notification.findMany({
      where: {
        userId,
        channel: 'IN_APP',
        ...(unreadOnly ? { status: { not: 'READ' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async unreadCount(userId: string) {
    return db.notification.count({
      where: { userId, channel: 'IN_APP', status: { not: 'READ' } },
    });
  },
};
