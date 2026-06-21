/**
 * GET /api/enrollments — List the current student's enrollments
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          teacher: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { modules: true },
          },
        },
      },
      certificate: {
        select: { id: true, certificateNumber: true, issuedAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: enrollments });
}
