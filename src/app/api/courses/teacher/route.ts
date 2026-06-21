/**
 * GET /api/courses/teacher — List courses created by the current teacher/admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import type { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasRole(session.user.role as Role, ['TEACHER', 'ADMIN'])) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // If admin, return all courses. If teacher, return only their courses.
  const where = session.user.role === 'ADMIN'
    ? {}
    : { teacherId: session.user.id };

  const courses = await db.course.findMany({
    where,
    include: {
      teacher: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          enrollments: true,
          modules: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: courses });
}
