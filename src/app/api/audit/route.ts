/**
 * Audit log API (admin only)
 * GET /api/audit — list audit logs with filters
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!can(session.user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const userId = url.searchParams.get('userId');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const items = await db.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const nextCursor = items.length > limit ? items[items.length - 1].id : null;
  return NextResponse.json({ items: items.slice(0, limit), nextCursor });
}
