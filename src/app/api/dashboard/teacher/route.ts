/**
 * GET /api/dashboard/teacher — Stats for the teacher dashboard
 * Returns: totalCourses, totalStudents, totalRevenue, avgRating
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import type { Role } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!hasRole(session.user.role as Role, ['TEACHER', 'ADMIN'])) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // For admin: stats across all courses. For teacher: only their courses.
  const courseFilter = session.user.role === 'ADMIN'
    ? {}
    : { teacherId: session.user.id };

  const courses = await db.course.findMany({
    where: courseFilter,
    select: {
      id: true,
      title: true,
      price: true,
      enrollmentsCount: true,
      rating: true,
      status: true,
    },
  });

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter(c => c.status === 'DRAFT').length;
  const totalStudents = courses.reduce((sum, c) => sum + c.enrollmentsCount, 0);
  const avgRating = courses.length > 0
    ? courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
    : 0;

  // Total revenue (sum of paid enrollments)
  const revenue = await db.payment.aggregate({
    where: {
      status: 'PAID',
      ...(session.user.role !== 'ADMIN' && {
        enrollment: {
          course: { teacherId: session.user.id },
        },
      }),
    },
    _sum: { amount: true },
  });

  // Recent enrollments
  const recentEnrollments = await db.enrollment.findMany({
    where: {
      ...(session.user.role !== 'ADMIN' && {
        course: { teacherId: session.user.id },
      }),
    },
    include: {
      student: { select: { id: true, name: true, image: true } },
      course: { select: { id: true, title: true, slug: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({
    stats: {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalStudents,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRevenue: revenue._sum.amount || 0,
    },
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      students: c.enrollmentsCount,
      rating: c.rating,
      status: c.status,
      price: c.price,
    })),
    recentEnrollments,
  });
}
