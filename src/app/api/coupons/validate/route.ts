/**
 * POST /api/coupons/validate — Validate a coupon code for a course
 *
 * Body: { code, courseId, originalPrice }
 * Returns: { valid, discountAmount, finalPrice, coupon }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateCoupon } from '@/lib/coupons';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const { code, courseId, originalPrice } = body;

  if (!code || !courseId || typeof originalPrice !== 'number') {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const result = await validateCoupon(code, courseId, session.user.id, originalPrice);
  return NextResponse.json(result);
}
