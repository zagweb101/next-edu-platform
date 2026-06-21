/**
 * Audit Log — track all sensitive actions across the app
 * Usage:
 *   import { audit } from '@/lib/audit';
 *   await audit.log({ userId, action: 'user.login', ipAddress, userAgent });
 */
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.delete'
  | 'role.assign'
  | 'role.revoke'
  | 'payment.initiate'
  | 'payment.succeed'
  | 'payment.fail'
  | 'payment.refund'
  | 'subscription.create'
  | 'subscription.cancel'
  | 'notification.send'
  | 'file.upload'
  | 'file.delete'
  | 'setting.update'
  | string;

export interface AuditEntry {
  userId?: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  paymentId?: string;
}

export const audit = {
  async log(entry: AuditEntry) {
    try {
      await db.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ?? undefined,
          paymentId: entry.paymentId,
        },
      });
    } catch (err) {
      logger.error({ err, entry }, 'audit.log failed');
    }
  },

  async list(opts: { userId?: string; action?: string; limit?: number; cursor?: string } = {}) {
    const { userId, action, limit = 50, cursor } = opts;
    return db.auditLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },
};

/**
 * Convenience wrapper for audit.log()
 * Usage: import { logAudit } from '@/lib/audit'; await logAudit({...});
 */
export async function logAudit(entry: AuditEntry) {
  return audit.log(entry);
}
