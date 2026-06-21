/**
 * Course learning page — for enrolled students
 * Shows video player + lesson list + progress tracking
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { LessonPlayer } from '@/components/edu/lesson-player';
import { LessonSidebar } from '@/components/edu/lesson-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { formatDuration } from '@/lib/format';

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/courses/${slug}/learn`);
  }

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!course || course.status !== 'PUBLISHED') {
    notFound();
  }

  // Verify enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: session.user.id,
      },
    },
    include: {
      lessons: true, // LessonProgress[]
    },
  });

  // Allow teachers/admins to preview without enrollment
  const isTeacher = course.teacherId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!enrollment && !isTeacher && !isAdmin) {
    redirect(`/${locale}/courses/${slug}`);
  }

  // Find the first lesson (or the next incomplete one)
  const allLessons = course.modules.flatMap(m => m.lessons);
  const firstLesson =
    allLessons.find(l =>
      !enrollment?.lessons.find(lp => lp.lessonId === l.id && lp.completed)
    ) || allLessons[0];

  if (!firstLesson) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {locale === 'ar' ? 'لا توجد دروس في هذا الكورس' : 'No lessons in this course'}
        </h1>
        <Link href={`/courses/${slug}`}>
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'العودة للكورس' : 'Back to course'}
          </Button>
        </Link>
      </div>
    );
  }

  // Build lesson list with progress
  const lessonsWithProgress = course.modules.map(module => ({
    ...module,
    lessons: module.lessons.map(lesson => ({
      ...lesson,
      progress: enrollment?.lessons.find(lp => lp.lessonId === lesson.id),
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/courses/${slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 me-2 rtl:rotate-180" />
              <span className="font-medium truncate max-w-xs">{course.title}</span>
            </Button>
          </Link>
          {enrollment && (
            <div className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'التقدم' : 'Progress'}: {enrollment.progress}%
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
        {/* Player */}
        <div className="p-4 lg:p-6">
          <LessonPlayer
            lesson={firstLesson}
            courseSlug={slug}
            locale={locale || 'ar'}
            enrollmentId={enrollment?.id}
          />
        </div>

        {/* Sidebar with lessons */}
        <div className="border-s bg-card max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <LessonSidebar
            modules={lessonsWithProgress}
            courseSlug={slug}
            currentLessonId={firstLesson.id}
            locale={locale || 'ar'}
          />
        </div>
      </div>
    </div>
  );
}
