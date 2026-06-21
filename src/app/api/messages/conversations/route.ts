/**
 * GET /api/messages/conversations — List current user's conversations
 * POST /api/messages/conversations — Start a new conversation (1-on-1 or group)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Find all conversations where user is a participant
  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  // Compute unread counts per conversation
  const result = await Promise.all(
    conversations.map(async (conv) => {
      const participant = conv.participants.find((p) => p.userId === session.user.id);
      const lastReadAt = participant?.lastReadAt;
      const unreadCount = await db.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: session.user.id },
          isDeleted: false,
          ...(lastReadAt && { createdAt: { gt: lastReadAt } }),
        },
      });
      return { ...conv, unreadCount };
    })
  );

  return NextResponse.json({ items: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const participantIds: string[] = body.participantIds || [];

  if (participantIds.length === 0) {
    return NextResponse.json({ error: 'NO_PARTICIPANTS' }, { status: 400 });
  }

  // For 1-on-1 chats, check if conversation already exists
  if (participantIds.length === 1) {
    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: participantIds[0] } } },
          // Ensure only 2 participants (1-on-1)
        ],
      },
      include: {
        participants: true,
      },
    });

    // Verify it's a 1-on-1
    if (existing && existing.participants.length === 2) {
      return NextResponse.json(existing);
    }
  }

  // Create new conversation
  const allParticipants = Array.from(new Set([session.user.id, ...participantIds]));

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: allParticipants.map((userId) => ({ userId })),
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
      },
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
