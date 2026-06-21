/**
 * Teacher: Create new live session
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LiveSessionForm } from '@/components/live/live-session-form';

export default async function NewLiveSessionPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/teach/live/new`);
  }

  if (!['TEACHER', 'ADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }

  // Get teacher's courses for the dropdown
  const courses = await db.course.findMany({
    where: session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'إنشاء جلسة مباشرة' : 'Create Live Session'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'حدد موعد جلسة مباشرة مع طلابك'
            : 'Schedule a live session with your students'}
        </p>
      </div>

      <LiveSessionForm courses={courses} locale={locale || 'ar'} />
    </div>
  );
}
