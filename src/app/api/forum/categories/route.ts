/**
 * GET /api/forum/categories — List all forum categories
 * POST /api/forum/categories — Create a category (ADMIN only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const categories = await db.forumCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { topics: true } },
    },
  });
  return NextResponse.json({ items: categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = await req.json();
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-');
  const category = await db.forumCategory.create({
    data: { name: body.name, slug, description: body.description, color: body.color, order: body.order || 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
