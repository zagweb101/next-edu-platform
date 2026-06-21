/**
 * POST /api/forum/posts/[id]/like — Toggle like on a forum post
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
  const post = await db.forumPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Check existing like
  const existing = await db.forumPostLike.findUnique({
    where: {
      postId_userId: { postId: id, userId: session.user.id },
    },
  });

  if (existing) {
    await db.forumPostLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await db.forumPostLike.create({
      data: { postId: id, userId: session.user.id },
    });
    return NextResponse.json({ liked: true });
  }
}
