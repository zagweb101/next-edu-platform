/**
 * GET /api/dashboard/student — Stats for the student dashboard
 * Returns: enrolledCourses count, completedCourses, inProgress, totalHours, certificates
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        select: { id: true, title: true, thumbnail: true, duration: true },
      },
    },
  });

  const totalEnrollments = enrollments.length;
  const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
  const inProgressCount = enrollments.filter(e => e.status === 'ACTIVE').length;

  // Total learning hours (sum of lesson progress)
  const progressAgg = await db.lessonProgress.aggregate({
    where: { enrollment: { studentId: session.user.id } },
    _sum: { watchedSeconds: true },
  });
  const totalHours = Math.round((progressAgg._sum.watchedSeconds || 0) / 3600);

  const certificatesCount = await db.certificate.count({
    where: { studentId: session.user.id },
  });

  // Continue learning: 3 most recently accessed enrollments
  const continueLearning = await db.enrollment.findMany({
    where: {
      studentId: session.user.id,
      status: 'ACTIVE',
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: 3,
  });

  // Recommended courses (not enrolled)
  const enrolledCourseIds = enrollments.map(e => e.courseId);
  const recommended = await db.course.findMany({
    where: {
      status: 'PUBLISHED',
      id: { notIn: enrolledCourseIds },
    },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { enrollmentsCount: 'desc' },
    take: 4,
  });

  return NextResponse.json({
    stats: {
      totalEnrollments,
      completedCount,
      inProgressCount,
      totalHours,
      certificatesCount,
    },
    continueLearning,
    recommended,
  });
}
