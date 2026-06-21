/**
 * Coupon validation utilities
 */
import { db } from '@/lib/db';

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  discountAmount?: number;
  finalPrice?: number;
}

/**
 * Validate a coupon code against a course + user + price.
 * Returns the discount amount and final price.
 */
export async function validateCoupon(
  code: string,
  courseId: string,
  userId: string,
  originalPrice: number,
): Promise<CouponValidationResult> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!coupon) {
    return { valid: false, reason: 'COUPON_NOT_FOUND' };
  }

  if (!coupon.isActive) {
    return { valid: false, reason: 'COUPON_INACTIVE' };
  }

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return { valid: false, reason: 'COUPON_NOT_YET_VALID' };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { valid: false, reason: 'COUPON_EXPIRED' };
  }

  // Course-specific coupon
  if (coupon.courseId && coupon.courseId !== courseId) {
    return { valid: false, reason: 'COUPON_NOT_FOR_THIS_COURSE' };
  }

  // Min amount check
  if (coupon.minAmount && originalPrice < coupon.minAmount) {
    return { valid: false, reason: 'MIN_AMOUNT_NOT_MET' };
  }

  // Max uses global
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: 'COUPON_MAX_USES_REACHED' };
  }

  // Max uses per user
  if (coupon.maxUsesPerUser > 0) {
    const userUsage = await db.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsage >= coupon.maxUsesPerUser) {
      return { valid: false, reason: 'COUPON_MAX_USES_PER_USER' };
    }
  }

  // Calculate discount
  let discountAmount: number;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (originalPrice * coupon.value) / 100;
  } else {
    discountAmount = Math.min(coupon.value, originalPrice);
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount,
    finalPrice,
  };
}

/**
 * Record a coupon usage (called after successful payment).
 */
export async function recordCouponUsage(params: {
  couponId: string;
  userId: string;
  courseId: string;
  orderId: string;
  discountAmount: number;
}) {
  await db.$transaction([
    db.couponUsage.create({
      data: {
        couponId: params.couponId,
        userId: params.userId,
        courseId: params.courseId,
        orderId: params.orderId,
        discountAmount: params.discountAmount,
      },
    }),
    db.coupon.update({
      where: { id: params.couponId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);
}
