/**
 * GET /api/courses — List published courses (public)
 * POST /api/courses — Create a new course (TEACHER, ADMIN)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import type { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const search = searchParams.get('search');
  const isFeatured = searchParams.get('featured');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  const courses = await db.course.findMany({
    where: {
      status: 'PUBLISHED',
      ...(level && { level: level as any }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(isFeatured === 'true' && { isFeatured: true }),
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          title: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  return NextResponse.json({
    items: courses,
    nextCursor: courses.length === limit ? courses[courses.length - 1].id : null,
  });
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

  // Generate slug if not provided
  const slug = body.slug || generateSlug(body.title);

  // Check slug uniqueness
  const existing = await db.course.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'SLUG_ALREADY_EXISTS' }, { status: 409 });
  }

  const course = await db.course.create({
    data: {
      title: body.title,
      slug,
      description: body.description,
      whatYouLearn: body.whatYouLearn,
      requirements: body.requirements,
      teacherId: session.user.id,
      price: body.price ?? 0,
      comparePrice: body.comparePrice,
      level: body.level || 'BEGINNER',
      language: body.language || 'ar',
      thumbnail: body.thumbnail,
      previewVideo: body.previewVideo,
      status: 'DRAFT',
      isFeatured: false,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: 'course.create',
    entity: 'Course',
    entityId: course.id,
    metadata: { title: course.title, slug: course.slug },
  });

  return NextResponse.json(course, { status: 201 });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Math.random().toString(36).slice(2, 6);
}
