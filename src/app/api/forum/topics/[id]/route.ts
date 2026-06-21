/**
 * GET /api/forum/topics/[id] — Get a topic with its posts
 * POST /api/forum/topics/[id] — Add a reply (any logged-in user)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  // Increment views
  await db.forumTopic.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });

  const topic = await db.forumTopic.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { id: true, name: true, image: true, title: true } },
      course: { select: { id: true, title: true, slug: true } },
      posts: {
        include: {
          author: { select: { id: true, name: true, image: true, title: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Check if current user liked the topic
  let userLiked = false;
  if (session?.user) {
    const like = await db.forumTopicLike.findUnique({
      where: {
        topicId_userId: { topicId: id, userId: session.user.id },
      },
    });
    userLiked = !!like;
  }

  return NextResponse.json({ ...topic, userLiked });
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
  const topic = await db.forumTopic.findUnique({ where: { id } });
  if (!topic) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (topic.isLocked) {
    return NextResponse.json({ error: 'TOPIC_LOCKED' }, { status: 400 });
  }

  const body = await req.json();
  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'CONTENT_EMPTY' }, { status: 400 });
  }

  const post = await db.forumPost.create({
    data: {
      topicId: id,
      authorId: session.user.id,
      content: body.content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, image: true, title: true } },
    },
  });

  // Update topic stats
  await db.forumTopic.update({
    where: { id },
    data: {
      postsCount: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(post, { status: 201 });
}
