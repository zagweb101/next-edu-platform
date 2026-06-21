/**
 * Affiliate program utilities
 */
import { db } from '@/lib/db';

/**
 * Generate a unique referral code for a user.
 * Format: <username_or_id>-<random_6_chars>
 */
export function generateReferralCode(userId: string, userName?: string): string {
  const base = (userName || userId)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'ref';
  const random = Math.random().toString(36).slice(2, 8);
  return `${base}-${random}`;
}

/**
 * Get or create an affiliate account for a user.
 */
export async function getOrCreateAffiliate(userId: string, userName?: string) {
  const existing = await db.affiliate.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return db.affiliate.create({
    data: {
      userId,
      referralCode: generateReferralCode(userId, userName),
      commissionRate: 10, // default 10%
    },
  });
}

/**
 * Record a click on an affiliate referral link.
 * Called when a visitor opens a referral URL.
 */
export async function trackClick(params: {
  referralCode: string;
  targetUrl: string;
  courseId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}) {
  const affiliate = await db.affiliate.findUnique({
    where: { referralCode: params.referralCode },
  });
  if (!affiliate || affiliate.status !== 'ACTIVE') {
    return null;
  }

  const click = await db.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      userId: params.userId,
      targetUrl: params.targetUrl,
      courseId: params.courseId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      referrer: params.referrer,
    },
  });

  // Increment affiliate stats
  await db.affiliate.update({
    where: { id: affiliate.id },
    data: { totalClicks: { increment: 1 } },
  });

  // Set cookie on visitor (handled in API route)
  return click;
}

/**
 * Record a conversion (signup, enrollment, or purchase).
 * Called after a referred user completes a desired action.
 */
export async function recordConversion(params: {
  clickId?: string;
  affiliateId: string;
  referredUserId?: string;
  courseId?: string;
  paymentId?: string;
  type: 'SIGNUP' | 'ENROLLMENT' | 'PURCHASE';
  amount: number; // in SAR
}) {
  const affiliate = await db.affiliate.findUnique({
    where: { id: params.affiliateId },
  });
  if (!affiliate) return null;

  const commission = (params.amount * affiliate.commissionRate) / 100;

  const conversion = await db.affiliateConversion.create({
    data: {
      affiliateId: params.affiliateId,
      referredUserId: params.referredUserId,
      courseId: params.courseId,
      paymentId: params.paymentId,
      type: params.type,
      amount: params.amount,
      commission,
      status: 'PENDING_PAYOUT',
      clickId: params.clickId,
    },
  });

  // Update affiliate stats
  await db.affiliate.update({
    where: { id: params.affiliateId },
    data: {
      totalConversions: { increment: 1 },
      totalEarnings: { increment: commission },
      pendingBalance: { increment: commission },
      ...(params.type === 'SIGNUP' && { totalSignups: { increment: 1 } }),
    },
  });

  // Mark click as converted
  if (params.clickId) {
    await db.affiliateClick.update({
      where: { id: params.clickId },
      data: { converted: true },
    });
  }

  return conversion;
}
