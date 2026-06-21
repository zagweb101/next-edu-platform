/**
 * GET /api/messages/conversations/[id]/messages — Get messages in a conversation
 * POST /api/messages/conversations/[id]/messages — Send a message
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await params;

  // Verify user is a participant
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });
  if (!participant) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const messages = await db.message.findMany({
    where: { conversationId: id, isDeleted: false },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  // Mark as read
  await db.conversationParticipant.update({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    items: messages.reverse(),
    nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await params;

  // Verify user is a participant
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: session.user.id },
    },
  });
  if (!participant) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'CONTENT_EMPTY' }, { status: 400 });
  }

  const message = await db.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      content: body.content.trim().slice(0, 5000),
      attachments: body.attachments || null,
      replyToId: body.replyToId || null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  // Update conversation's lastMessageAt
  await db.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
