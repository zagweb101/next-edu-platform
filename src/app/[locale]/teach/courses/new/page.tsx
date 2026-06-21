/**
 * Create new course page — Teacher
 */
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CourseForm } from '@/components/edu/course-form';

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/teach/courses/new`);
  }

  if (!['TEACHER', 'ADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'إنشاء كورس جديد' : 'Create New Course'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'املأ بيانات الكورس الأساسية. يمكنك تعديلها لاحقاً.'
            : 'Fill in the basic course information. You can edit it later.'}
        </p>
      </div>

      <CourseForm locale={locale || 'ar'} mode="create" />
    </div>
  );
}
