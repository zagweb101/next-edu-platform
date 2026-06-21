/**
 * POST /api/affiliate/click — Track a click on a referral link
 * Body: { referralCode, targetUrl, courseId? }
 *
 * Sets a cookie to attribute future conversions to this affiliate.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { trackClick } from '@/lib/affiliate';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { referralCode, targetUrl, courseId } = body;

  if (!referralCode || !targetUrl) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const session = await auth();
  const click = await trackClick({
    referralCode,
    targetUrl,
    courseId,
    userId: session?.user?.id,
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    referrer: req.headers.get('referer') || undefined,
  });

  if (!click) {
    return NextResponse.json({ error: 'INVALID_REFERRAL_CODE' }, { status: 404 });
  }

  // Set cookie to track this visitor for 30 days
  const response = NextResponse.json({ success: true, clickId: click.id });
  response.cookies.set('affiliate_click_id', click.id, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
