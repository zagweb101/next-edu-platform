/**
 * Notifications API
 * GET  /api/notifications            — list current user's notifications
 *       ?count=unread                — return { count: N } of unread
 *       ?limit=20&cursor=xxx         — paginated list
 * PATCH /api/notifications           — mark all as read
 *        ?id=xxx                     — mark specific one as read
 * POST  /api/notifications/test      — send a test notification to current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notify } from '@/lib/notifications';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const url = new URL(req.url);
  const userId = session.user.id;

  if (url.searchParams.get('count') === 'unread') {
    const count = await db.notification.count({
      where: { userId, channel: 'IN_APP', status: { not: 'READ' } },
    });
    return NextResponse.json({ count });
  }

  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

  const items = await db.notification.findMany({
    where: {
      userId,
      channel: 'IN_APP',
      ...(unreadOnly ? { status: { not: 'READ' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const nextCursor = items.length > limit ? items[items.length - 1].id : null;
  return NextResponse.json({ items: items.slice(0, limit), nextCursor });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const userId = session.user.id;

  if (id) {
    await db.notification.updateMany({
      where: { id, userId },
      data: { status: 'READ', readAt: new Date() },
    });
  } else {
    await db.notification.updateMany({
      where: { userId, channel: 'IN_APP', status: { not: 'READ' } },
      data: { status: 'READ', readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    await notify.send({
      userId: session.user.id,
      title: body.title ?? 'Test notification',
      body: body.body ?? 'This is a test from the boilerplate.',
      type: body.type ?? 'info',
      link: body.link,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send test notification');
    return NextResponse.json({ error: 'SEND_FAILED' }, { status: 500 });
  }
}
