/**
 * GET /api/affiliate — Get current user's affiliate account + stats
 * POST /api/affiliate — Create an affiliate account for current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateAffiliate } from '@/lib/affiliate';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { clicks: true, conversions: true, payouts: true },
      },
    },
  });

  if (!affiliate) {
    affiliate = await getOrCreateAffiliate(session.user.id, session.user.name || undefined);
  }

  // Recent conversions
  const recentConversions = await db.affiliateConversion.findMany({
    where: { affiliateId: affiliate.id },
    include: {
      course: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Recent payouts
  const recentPayouts = await db.affiliatePayout.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({
    ...affiliate,
    recentConversions,
    recentPayouts,
    referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${affiliate.referralCode}`,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const affiliate = await getOrCreateAffiliate(session.user.id, session.user.name || undefined);
  return NextResponse.json(affiliate, { status: 201 });
}
