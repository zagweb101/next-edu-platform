/**
 * Course detail page — public
 * Shows full course info: description, curriculum, teacher, reviews
 * Logged-in users can enroll
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star, Users, Clock, PlayCircle, CheckCircle2, Lock,
  Award, Globe, BarChart3, FileText, ChevronDown, ChevronLeft,
} from 'lucide-react';
import { EnrollButton } from '@/components/edu/enroll-button';
import { formatCurrency, formatDuration } from '@/lib/format';
import { formatRelative } from '@/lib/format';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      teacher: {
        select: {
          id: true, name: true, image: true, title: true,
          bio: true, expertise: true, socialLinks: true,
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, type: true, videoDuration: true,
              order: true, isPreview: true, videoUrl: true,
            },
          },
        },
      },
      reviews: {
        include: {
          student: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course || course.status !== 'PUBLISHED') {
    notFound();
  }

  // Check enrollment
  const enrollment = session?.user
    ? await db.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: course.id,
            studentId: session.user.id,
          },
        },
        select: { id: true, status: true, progress: true },
      })
    : null;

  const isEnrolled = !!enrollment;
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const levelAr: Record<string, string> = {
    BEGINNER: 'مبتدئ', INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم', ALL_LEVELS: 'كل المستويات',
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course info (left) */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">{levelAr[course.level] || course.level}</Badge>
                <Badge variant="outline">
                  <Globe className="h-3 w-3 me-1" />
                  {course.language === 'ar' ? 'العربية' : 'English'}
                </Badge>
                {course.isFeatured && (
                  <Badge>{locale === 'ar' ? 'مميز' : 'Featured'}</Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground text-lg mb-4">{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold text-foreground">{course.rating.toFixed(1)}</span>
                  <span>({course._count.reviews} {locale === 'ar' ? 'تقييم' : 'reviews'})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course._count.enrollments} {locale === 'ar' ? 'طالب' : 'students'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{levelAr[course.level] || course.level}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalLessons} {locale === 'ar' ? 'درس' : 'lessons'}</span>
                </div>
              </div>

              {/* Teacher */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={course.teacher.image || ''} />
                  <AvatarFallback>{course.teacher.name?.[0] || 'T'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar' ? 'المعلّم' : 'Instructor'}
                  </p>
                  <p className="font-medium">{course.teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{course.teacher.title}</p>
                </div>
              </div>
            </div>

            {/* Sidebar (right) - enrollment card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                {course.thumbnail && (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-white" />
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex items-baseline gap-2 mb-4">
                    {course.price === 0 ? (
                      <span className="text-3xl font-bold text-green-600">
                        {locale === 'ar' ? 'مجاني' : 'Free'}
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          {formatCurrency(course.price, locale)}
                        </span>
                        {course.comparePrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            {formatCurrency(course.comparePrice, locale)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Link href={`/courses/${course.slug}/learn`}>
                      <Button className="w-full" size="lg">
                        {locale === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                        <ChevronLeft className="h-4 w-4 ms-1 rtl:rotate-180" />
                      </Button>
                    </Link>
                  ) : (
                    <EnrollButton
                      courseSlug={course.slug}
                      price={course.price}
                      locale={locale || 'ar'}
                      isLoggedIn={!!session?.user}
                    />
                  )}

                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {locale === 'ar' ? 'المستوى' : 'Level'}
                      </span>
                      <span>{levelAr[course.level] || course.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {locale === 'ar' ? 'المدة' : 'Duration'}
                      </span>
                      <span>{formatDuration(course.duration, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {locale === 'ar' ? 'الدروس' : 'Lessons'}
                      </span>
                      <span>{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {locale === 'ar' ? 'اللغة' : 'Language'}
                      </span>
                      <span>{course.language === 'ar' ? 'العربية' : 'English'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {locale === 'ar' ? 'شهادة' : 'Certificate'}
                      </span>
                      <span>{locale === 'ar' ? 'نعم' : 'Yes'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="overview">
                  {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="curriculum">
                  {locale === 'ar' ? 'المنهج' : 'Curriculum'}
                </TabsTrigger>
                <TabsTrigger value="instructor">
                  {locale === 'ar' ? 'المعلّم' : 'Instructor'}
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  {locale === 'ar' ? 'التقييمات' : 'Reviews'}
                </TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{locale === 'ar' ? 'ماذا ستتعلم' : 'What you\'ll learn'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.whatYouLearn ? (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {course.whatYouLearn.split('\n').filter(Boolean).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">{course.description}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{locale === 'ar' ? 'المتطلبات' : 'Requirements'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.requirements ? (
                      <ul className="space-y-2">
                        {course.requirements.split('\n').filter(Boolean).map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        {locale === 'ar' ? 'لا توجد متطلبات مسبقة' : 'No prerequisites'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{locale === 'ar' ? 'وصف الكورس' : 'Course description'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Curriculum */}
              <TabsContent value="curriculum">
                <Card>
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-muted/30">
                      <div className="flex items-center justify-between text-sm">
                        <span>{course.modules.length} {locale === 'ar' ? 'وحدات' : 'modules'}</span>
                        <span>{totalLessons} {locale === 'ar' ? 'درس' : 'lessons'}</span>
                      </div>
                    </div>
                    <div className="divide-y">
                      {course.modules.map((module, mIdx) => (
                        <details key={module.id} className="group" open={mIdx === 0}>
                          <summary className="p-4 cursor-pointer hover:bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                              <span className="font-medium">{module.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {module.lessons.length} {locale === 'ar' ? 'درس' : 'lessons'}
                            </span>
                          </summary>
                          <div className="bg-muted/10">
                            {module.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="px-4 py-3 flex items-center justify-between border-t border-muted/30 hover:bg-muted/30"
                              >
                                <div className="flex items-center gap-3 ms-4">
                                  {lesson.isPreview || isEnrolled ? (
                                    <PlayCircle className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.isPreview && !isEnrolled && (
                                    <Badge variant="outline" className="text-xs">
                                      {locale === 'ar' ? 'معاينة' : 'Preview'}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(lesson.videoDuration, locale)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Instructor */}
              <TabsContent value="instructor">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={course.teacher.image || ''} />
                        <AvatarFallback className="text-xl">
                          {course.teacher.name?.[0] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{course.teacher.name}</h3>
                        <p className="text-sm text-muted-foreground">{course.teacher.title}</p>
                        {course.teacher.expertise && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {course.teacher.expertise}
                          </p>
                        )}
                      </div>
                    </div>

                    {course.teacher.bio && (
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {course.teacher.bio}
                      </p>
                    )}

                    {course.teacher.socialLinks && (
                      <div className="flex gap-2">
                        {Object.entries(course.teacher.socialLinks as any).map(([key, val]) => (
                          <Badge key={key} variant="outline" className="capitalize">
                            {key}: {val as string}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'ar' ? 'تقييمات الطلاب' : 'Student Reviews'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {course.reviews.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                      </p>
                    ) : (
                      course.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.student.image || ''} />
                              <AvatarFallback>
                                {review.student.name?.[0] || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{review.student.name}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{formatRelative(review.createdAt, locale)}</span>
                              </div>
                            </div>
                            <div className="ms-auto flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-4 w-4 ${
                                    s <= review.rating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </main>
  );
}
