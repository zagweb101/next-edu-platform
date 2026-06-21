/**
 * GET /api/coupons/admin — List all coupons (ADMIN only)
 * POST /api/coupons/admin — Create a new coupon (ADMIN only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: coupons });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json();
  const coupon = await db.coupon.create({
    data: {
      code: body.code.toUpperCase(),
      description: body.description,
      type: body.type, // PERCENTAGE | FIXED
      value: body.value,
      maxUses: body.maxUses || 0,
      maxUsesPerUser: body.maxUsesPerUser || 1,
      courseId: body.courseId || null,
      minAmount: body.minAmount || null,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
