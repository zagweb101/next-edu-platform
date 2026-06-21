/**
 * GET /api/live — List live sessions (upcoming + live now)
 * POST /api/live — Create a new live session (TEACHER, ADMIN)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import type { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // LIVE | SCHEDULED | ENDED
  const courseId = searchParams.get('courseId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  const where = {
    ...(status && { status: status as any }),
    ...(courseId && { courseId }),
  };

  const sessions = await db.liveSession.findMany({
    where,
    include: {
      teacher: {
        select: { id: true, name: true, image: true },
      },
      course: {
        select: { id: true, title: true, slug: true, thumbnail: true },
      },
      _count: {
        select: { attendees: true, chatMessages: true },
      },
    },
    orderBy: [
      { status: 'asc' }, // LIVE first
      { scheduledStart: 'asc' },
    ],
    take: limit,
  });

  return NextResponse.json({ items: sessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasRole(session.user.role as Role, ['TEACHER', 'ADMIN'])) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json();

  // Generate a unique WebRTC room ID if needed
  const webrtcRoomId = body.provider === 'WEBRTC' || !body.provider
    ? `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    : null;

  const liveSession = await db.liveSession.create({
    data: {
      title: body.title,
      description: body.description,
      courseId: body.courseId || null,
      teacherId: session.user.id,
      provider: body.provider || 'WEBRTC',
      status: 'SCHEDULED',
      scheduledStart: new Date(body.scheduledStart),
      scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
      // Zoom fields
      zoomMeetingId: body.zoomMeetingId,
      zoomJoinUrl: body.zoomJoinUrl,
      zoomStartUrl: body.zoomStartUrl,
      zoomPassword: body.zoomPassword,
      // WebRTC
      webrtcRoomId,
      // YouTube/Vimeo
      youtubeLiveUrl: body.youtubeLiveUrl,
    },
  });

  return NextResponse.json(liveSession, { status: 201 });
}
