/**
 * Payments API
 * GET  /api/payments              — list payments (ADMIN/MANAGER)
 * GET  /api/payments?userId=xxx   — list payments for specific user
 * POST /api/payments              — initiate a new payment via Moyasar
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { moyasar } from '@/lib/payments/moyasar';
import { can } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
  description: z.string().min(1).max(255),
  callbackUrl: z.string().url(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get('userId');
  const isManagerOrAbove = can(session.user.role, 'MANAGER');

  // If user is not manager+, they can only see their own payments
  const userId = isManagerOrAbove && userIdParam ? userIdParam : session.user.id;

  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const status = url.searchParams.get('status');

  const items = await db.payment.findMany({
    where: {
      userId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const nextCursor = items.length > limit ? items[items.length - 1].id : null;
  return NextResponse.json({ items: items.slice(0, limit), nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await moyasar.createPayment({
      userId: session.user.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      description: parsed.data.description,
      callbackUrl: parsed.data.callbackUrl,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Payment initiation failed');
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PAYMENT_FAILED' },
      { status: 500 },
    );
  }
}
