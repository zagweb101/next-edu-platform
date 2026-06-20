/**
 * Users API (admin/manager only)
 * GET  /api/users             — list users
 * PATCH /api/users?id=xxx     — update user (role, isActive)
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { can } from '@/lib/rbac';
import { audit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
});

async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
  }
  if (!can(session.user.role, 'MANAGER')) {
    return { error: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(req: NextRequest) {
  const check = await requireManager();
  if ('error' in check) return check.error;
  const url = new URL(req.url);
  const search = url.searchParams.get('q');
  const role = url.searchParams.get('role');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);

  const users = await db.user.findMany({
    where: {
      ...(search
        ? {
            OR: [{ email: { contains: search } }, { name: { contains: search } }],
          }
        : {}),
      ...(role ? { role: role as never } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      image: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ items: users });
}

export async function PATCH(req: NextRequest) {
  const check = await requireManager();
  if ('error' in check) return check.error;
  const session = check.session;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Only ADMIN can change roles
  if (parsed.data.role && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const updated = await db.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await audit.log({
    userId: session.user.id,
    action: 'role.assign',
    entity: 'User',
    entityId: id,
    metadata: parsed.data,
  });
  logger.info({ adminId: session.user.id, targetId: id, changes: parsed.data }, 'User updated');

  return NextResponse.json(updated);
}
