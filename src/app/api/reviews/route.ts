/**
 * POST /api/reviews — Create or update a review
 * Body: { courseId, rating (1-5), comment? }
 *
 * Only students who are enrolled can review.
 * One review per course per student.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const { courseId, rating, comment } = body;

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: session.user.id,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });
  }

  // Upsert review
  const review = await db.review.upsert({
    where: {
      courseId_studentId: {
        courseId,
        studentId: session.user.id,
      },
    },
    update: {
      rating: parseInt(rating, 10),
      comment,
    },
    create: {
      courseId,
      studentId: session.user.id,
      rating: parseInt(rating, 10),
      comment,
    },
  });

  // Recalculate course rating
  const avgRating = await db.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
  });

  await db.course.update({
    where: { id: courseId },
    data: { rating: avgRating._avg.rating || 0 },
  });

  return NextResponse.json(review, { status: 201 });
}
