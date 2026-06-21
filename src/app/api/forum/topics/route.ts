/**
 * GET /api/forum/topics — List topics (with filters)
 * POST /api/forum/topics — Create a new topic (any logged-in user)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const courseId = searchParams.get('courseId');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  const topics = await db.forumTopic.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(courseId && { courseId }),
      ...(search && { title: { contains: search } }),
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      author: { select: { id: true, name: true, image: true } },
      course: { select: { id: true, title: true, slug: true } },
      _count: {
        select: { posts: true, likes: true },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: limit,
  });

  return NextResponse.json({ items: topics });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const slug = `${body.title.toLowerCase().replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}-${Date.now().toString(36)}`;

  const topic = await db.forumTopic.create({
    data: {
      categoryId: body.categoryId,
      courseId: body.courseId || null,
      authorId: session.user.id,
      title: body.title,
      slug,
      content: body.content,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(topic, { status: 201 });
}
