/**
 * GET /api/courses/[slug] — Get a single course with modules + lessons (public)
 * PATCH /api/courses/[slug] — Update a course (TEACHER owner, ADMIN)
 * DELETE /api/courses/[slug] — Delete a course (TEACHER owner, ADMIN)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import type { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          image: true,
          title: true,
          bio: true,
          expertise: true,
          socialLinks: true,
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              videoDuration: true,
              order: true,
              isPreview: true,
              // Only include videoUrl for preview lessons OR enrolled students
              videoUrl: true,
              pdfUrl: true,
            },
          },
        },
      },
      reviews: {
        include: {
          student: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // If user is logged in, check if they're enrolled
  let enrollment = null;
  if (session?.user) {
    enrollment = await db.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        progress: true,
        lessons: {
          select: {
            lessonId: true,
            completed: true,
            watchedSeconds: true,
          },
        },
      },
    });
  }

  return NextResponse.json({
    ...course,
    enrollment,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { slug } = await params;
  const course = await db.course.findUnique({ where: { slug } });
  if (!course) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Only the teacher who owns this course or ADMIN can update
  const isOwner = course.teacherId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json();
  const updated = await db.course.update({
    where: { id: course.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.whatYouLearn !== undefined && { whatYouLearn: body.whatYouLearn }),
      ...(body.requirements !== undefined && { requirements: body.requirements }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.comparePrice !== undefined && { comparePrice: body.comparePrice }),
      ...(body.level && { level: body.level }),
      ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
      ...(body.previewVideo !== undefined && { previewVideo: body.previewVideo }),
      ...(body.status && { status: body.status }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: 'course.update',
    entity: 'Course',
    entityId: course.id,
    metadata: { slug, fields: Object.keys(body) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { slug } = await params;
  const course = await db.course.findUnique({ where: { slug } });
  if (!course) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = course.teacherId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  await db.course.delete({ where: { id: course.id } });

  await logAudit({
    userId: session.user.id,
    action: 'course.delete',
    entity: 'Course',
    entityId: course.id,
    metadata: { title: course.title, slug: course.slug },
  });

  return NextResponse.json({ success: true });
}
