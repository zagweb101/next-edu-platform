/**
 * POST /api/courses/[slug]/enroll — Enroll the current student in a course
 *
 * - Free course: creates enrollment directly
 * - Paid course: creates a Moyasar payment + returns checkout URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(
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
  if (course.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'COURSE_NOT_PUBLISHED' }, { status: 400 });
  }

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: session.user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'ALREADY_ENROLLED', enrollment: existing }, { status: 409 });
  }

  // FREE COURSE — create enrollment immediately
  if (course.price === 0) {
    const enrollment = await db.enrollment.create({
      data: {
        courseId: course.id,
        studentId: session.user.id,
        status: 'ACTIVE',
      },
    });

    // Update enrollmentsCount
    await db.course.update({
      where: { id: course.id },
      data: { enrollmentsCount: { increment: 1 } },
    });

    // Send notifications
    await sendNotification({
      userId: session.user.id,
      channel: 'IN_APP',
      title: 'تم التسجيل في الكورس',
      body: `أهلاً بك في "${course.title}". ابدأ التعلم الآن!`,
      type: 'success',
      metadata: { courseId: course.id, enrollmentId: enrollment.id },
    });

    // Notify the teacher
    await sendNotification({
      userId: course.teacherId,
      channel: 'IN_APP',
      title: 'طالب جديد في كورسك',
      body: `${session.user.name || 'طالب'} سجل في "${course.title}"`,
      type: 'info',
      metadata: { courseId: course.id, studentId: session.user.id },
    });

    await logAudit({
      userId: session.user.id,
      action: 'course.enroll',
      entity: 'Course',
      entityId: course.id,
      metadata: { enrollmentId: enrollment.id, price: 0 },
    });

    return NextResponse.json({ enrollment, payment: null }, { status: 201 });
  }

  // PAID COURSE — create a Moyasar payment
  // For now, we'll create a placeholder. In production, integrate with Moyasar.
  const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;

  if (!moyasarSecretKey || moyasarSecretKey.startsWith('sk_test_xxx')) {
    // Dev mode: auto-enroll without payment (for testing)
    const enrollment = await db.enrollment.create({
      data: {
        courseId: course.id,
        studentId: session.user.id,
        status: 'ACTIVE',
      },
    });

    await db.course.update({
      where: { id: course.id },
      data: { enrollmentsCount: { increment: 1 } },
    });

    await sendNotification({
      userId: session.user.id,
      channel: 'IN_APP',
      title: 'تم التسجيل في الكورس (وضع التطوير)',
      body: `أهلاً بك في "${course.title}". تم التسجيل تلقائياً لأن Moyasar غير مُفعّل.`,
      type: 'success',
      metadata: { courseId: course.id },
    });

    await logAudit({
      userId: session.user.id,
      action: 'course.enroll',
      entity: 'Course',
      entityId: course.id,
      metadata: { enrollmentId: enrollment.id, devMode: true, price: course.price },
    });

    return NextResponse.json({
      enrollment,
      payment: null,
      devMode: true,
      message: 'Enrolled in dev mode — configure MOYASAR_SECRET_KEY for production',
    }, { status: 201 });
  }

  // Production: create Moyasar payment
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?courseId=${course.id}&studentId=${session.user.id}`;

  try {
    const moyasarResponse = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(moyasarSecretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(course.price * 100), // halalas
        currency: 'SAR',
        description: `اشتراك في كورس: ${course.title}`,
        callback_url: callbackUrl,
        source: {
          type: 'creditcard',
        },
        metadata: {
          courseId: course.id,
          studentId: session.user.id,
          type: 'course_enrollment',
        },
      }),
    });

    if (!moyasarResponse.ok) {
      const error = await moyasarResponse.text();
      console.error('Moyasar error:', error);
      return NextResponse.json({ error: 'PAYMENT_FAILED' }, { status: 502 });
    }

    const payment = await moyasarResponse.json();

    // Create a Payment record
    const paymentRecord = await db.payment.create({
      data: {
        userId: session.user.id,
        moyasarId: payment.id,
        amount: course.price,
        currency: 'SAR',
        status: 'INITIATED',
        description: `اشتراك في كورس: ${course.title}`,
        callbackUrl,
        metadata: { courseId: course.id },
      },
    });

    return NextResponse.json({
      enrollment: null,
      payment: paymentRecord,
      checkoutUrl: payment.source?.transaction_url || null,
    }, { status: 201 });
  } catch (error) {
    console.error('Moyasar API error:', error);
    return NextResponse.json({ error: 'PAYMENT_API_ERROR' }, { status: 500 });
  }
}
