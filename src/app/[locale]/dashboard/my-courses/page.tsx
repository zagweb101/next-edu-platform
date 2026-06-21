/**
 * Student dashboard — My Courses page
 * Shows enrolled courses with progress + continue learning CTAs
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Award, Clock, Sparkles } from 'lucide-react';
import { formatRelative, formatDuration } from '@/lib/format';

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/my-courses`);
  }

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          teacher: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
      certificate: { select: { id: true, certificateNumber: true } },
    },
    orderBy: { lastAccessedAt: 'desc' },
  });

  const continueLearning = enrollments.filter(e => e.status === 'ACTIVE');
  const completed = enrollments.filter(e => e.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'كورساتي' : 'My Courses'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? `${enrollments.length} كورس — ${completed.length} مكتمل، ${continueLearning.length} قيد التعلم`
            : `${enrollments.length} courses — ${completed.length} completed, ${continueLearning.length} in progress`}
        </p>
      </div>

      {/* Continue Learning */}
      {continueLearning.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            {locale === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {continueLearning.map(enrollment => (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {enrollment.course.thumbnail && (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Link href={`/courses/${enrollment.course.slug}/learn`}>
                      <Button size="lg">
                        <PlayCircle className="h-5 w-5 me-2" />
                        {locale === 'ar' ? 'متابعة' : 'Continue'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">
                    {enrollment.course.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {locale === 'ar' ? 'المعلّم' : 'Instructor'}: {enrollment.course.teacher.name}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {locale === 'ar' ? 'التقدم' : 'Progress'}
                    </span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </CardContent>

                <CardFooter>
                  <Link href={`/courses/${enrollment.course.slug}/learn`} className="w-full">
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 me-2" />
                      {locale === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            {locale === 'ar' ? 'كورسات مكتملة' : 'Completed Courses'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completed.map(enrollment => (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {enrollment.course.thumbnail && (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Badge className="absolute top-2 end-2 bg-green-600">
                    <Award className="h-3 w-3 me-1" />
                    {locale === 'ar' ? 'مكتمل' : 'Completed'}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">
                    {enrollment.course.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    {locale === 'ar' ? 'اكتمل في' : 'Completed on'}: {formatRelative(enrollment.completedAt || enrollment.updatedAt, locale)}
                  </p>
                  {enrollment.certificate && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Award className="h-3 w-3 me-1" />
                      {locale === 'ar' ? 'شهادة متاحة' : 'Certificate available'}
                    </Badge>
                  )}
                </CardContent>

                <CardFooter className="gap-2">
                  <Link href={`/courses/${enrollment.course.slug}/learn`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      {locale === 'ar' ? 'مراجعة' : 'Review'}
                    </Button>
                  </Link>
                  {enrollment.certificate && (
                    <Link href="/dashboard/certificates">
                      <Button variant="outline">
                        <Award className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {enrollments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2">
              {locale === 'ar' ? 'لم تشترك في أي كورس بعد' : 'You haven\'t enrolled in any courses yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {locale === 'ar'
                ? 'استكشف كورساتنا وابدأ رحلتك التعليمية'
                : 'Explore our courses and start your learning journey'}
            </p>
            <Link href="/courses">
              <Button size="lg">
                {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
