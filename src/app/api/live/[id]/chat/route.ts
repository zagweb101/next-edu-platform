/**
 * POST /api/live/[id]/chat — Send a chat message in a live session
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await params;
  const liveSession = await db.liveSession.findUnique({ where: { id } });
  if (!liveSession) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (liveSession.status !== 'LIVE') {
    return NextResponse.json({ error: 'SESSION_NOT_LIVE' }, { status: 400 });
  }

  const body = await req.json();
  if (!body.message || body.message.trim().length === 0) {
    return NextResponse.json({ error: 'MESSAGE_EMPTY' }, { status: 400 });
  }

  const message = await db.liveChatMessage.create({
    data: {
      liveSessionId: id,
      userId: session.user.id,
      message: body.message.trim().slice(0, 500), // limit to 500 chars
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
