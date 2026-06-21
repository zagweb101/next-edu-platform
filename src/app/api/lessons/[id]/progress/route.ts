/**
 * PATCH /api/lessons/[id]/progress — Update lesson progress for the current student
 *
 * Body:
 *   { watchedSeconds: number, completed?: boolean }
 *
 * Creates or updates a LessonProgress record.
 * Also updates the enrollment's overall progress percentage.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const body = await req.json();

  // Find the lesson + its course
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: { courseId: true },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: 'LESSON_NOT_FOUND' }, { status: 404 });
  }

  // Find the enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: lesson.module.courseId,
        studentId: session.user.id,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });
  }

  // Upsert lesson progress
  const progress = await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    update: {
      watchedSeconds: Math.max(body.watchedSeconds || 0, 0),
      ...(body.completed !== undefined && { completed: body.completed }),
      lastWatchedAt: new Date(),
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      watchedSeconds: body.watchedSeconds || 0,
      completed: body.completed || false,
      lastWatchedAt: new Date(),
    },
  });

  // Recalculate enrollment progress
  const allLessonsCount = await db.lesson.count({
    where: {
      module: { courseId: enrollment.courseId },
      isPublished: true,
    },
  });

  const completedLessonsCount = await db.lessonProgress.count({
    where: {
      enrollmentId: enrollment.id,
      completed: true,
    },
  });

  const newProgressPct = allLessonsCount === 0
    ? 0
    : Math.round((completedLessonsCount / allLessonsCount) * 100);

  // Update enrollment
  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress: newProgressPct,
      lastAccessedAt: new Date(),
      ...(newProgressPct === 100 && { status: 'COMPLETED', completedAt: new Date() }),
    },
  });

  // If course completed, issue a certificate
  if (newProgressPct === 100 && !enrollment.completedAt) {
    const existingCert = await db.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    if (!existingCert) {
      const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      await db.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          studentId: session.user.id,
          courseId: enrollment.courseId,
          certificateNumber: certNumber,
        },
      });

      // Notify student
      await db.notification.create({
        data: {
          userId: session.user.id,
          title: '🎉 مبروك! أكملت الكورس',
          body: `تم إصدار شهادتك بنجاح. اطبعها من صفحة شهاداتك.`,
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
          metadata: { courseId: enrollment.courseId },
        },
      });
    }
  }

  return NextResponse.json({ progress, enrollmentProgress: newProgressPct });
}
