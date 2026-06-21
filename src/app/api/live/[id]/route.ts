/**
 * GET /api/live/[id] — Get a live session details
 * PATCH /api/live/[id] — Update (start, end, cancel) — TEACHER/ADMIN
 * DELETE /api/live/[id] — Delete — TEACHER/ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import type { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const liveSession = await db.liveSession.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { id: true, name: true, image: true, title: true },
      },
      course: {
        select: { id: true, title: true, slug: true },
      },
      chatMessages: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
      _count: {
        select: { attendees: true },
      },
    },
  });

  if (!liveSession) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // If session is live, record attendee (if logged in)
  if (liveSession.status === 'LIVE' && session?.user) {
    await db.liveAttendee.upsert({
      where: {
        liveSessionId_userId: {
          liveSessionId: id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        liveSessionId: id,
        userId: session.user.id,
      },
    });

    // Update maxViewers if needed
    const currentCount = await db.liveAttendee.count({
      where: { liveSessionId: id },
    });
    if (currentCount > liveSession.maxViewers) {
      await db.liveSession.update({
        where: { id },
        data: { maxViewers: currentCount },
      });
    }
  }

  return NextResponse.json(liveSession);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasRole(session.user.role as Role, ['TEACHER', 'ADMIN'])) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const { id } = await params;
  const liveSession = await db.liveSession.findUnique({ where: { id } });
  if (!liveSession) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Only owner or admin
  if (liveSession.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json();

  // Handle status transitions
  const updates: any = {};
  if (body.title) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.scheduledStart) updates.scheduledStart = new Date(body.scheduledStart);
  if (body.scheduledEnd) updates.scheduledEnd = new Date(body.scheduledEnd);

  if (body.action === 'start') {
    updates.status = 'LIVE';
    updates.actualStart = new Date();
  } else if (body.action === 'end') {
    updates.status = 'ENDED';
    updates.actualEnd = new Date();
  } else if (body.action === 'cancel') {
    updates.status = 'CANCELED';
  }

  const updated = await db.liveSession.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasRole(session.user.role as Role, ['TEACHER', 'ADMIN'])) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const { id } = await params;
  const liveSession = await db.liveSession.findUnique({ where: { id } });
  if (!liveSession) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  if (liveSession.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  await db.liveSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
