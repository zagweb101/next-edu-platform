/**
 * Courses browse page — public
 * Shows all published courses with filters
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Users, Clock, PlayCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/auth';
import { formatCurrency, formatDuration } from '@/lib/format';

const LEVELS = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'] as const;

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ level?: string; search?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const { level, search } = await searchParams;
  const session = await auth();

  const courses = await db.course.findMany({
    where: {
      status: 'PUBLISHED',
      ...(level && level !== 'ALL' && { level: level as any }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    include: {
      teacher: {
        select: { id: true, name: true, image: true, title: true },
      },
      _count: {
        select: { enrollments: true, reviews: true },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { enrollmentsCount: 'desc' }],
  });

  return (
    <main className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {locale === 'ar' ? 'استكشف كورساتنا' : 'Explore Our Courses'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {locale === 'ar'
              ? 'آلاف الكورسات عالية الجودة من أفضل المعلّمين'
              : 'Thousands of high-quality courses from top instructors'}
          </p>

          {/* Search bar */}
          <form className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute start-4 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                defaultValue={search || ''}
                placeholder={locale === 'ar' ? 'ابحث عن كورس...' : 'Search for a course...'}
                className="ps-12 h-12 text-base"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Filters + Course grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {LEVELS.map((lvl) => (
            <Link
              key={lvl}
              href={`/courses?level=${lvl === 'ALL' ? '' : lvl}${search ? `&search=${search}` : ''}`}
            >
              <Badge
                variant={level === lvl || (!level && lvl === 'ALL') ? 'default' : 'outline'}
                className="cursor-pointer py-2 px-3"
              >
                {lvl === 'ALL'
                  ? (locale === 'ar' ? 'الكل' : 'All')
                  : lvl === 'BEGINNER'
                  ? (locale === 'ar' ? 'مبتدئ' : 'Beginner')
                  : lvl === 'INTERMEDIATE'
                  ? (locale === 'ar' ? 'متوسط' : 'Intermediate')
                  : lvl === 'ADVANCED'
                  ? (locale === 'ar' ? 'متقدم' : 'Advanced')
                  : (locale === 'ar' ? 'كل المستويات' : 'All Levels')}
              </Badge>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {courses.length} {locale === 'ar' ? 'كورس' : 'courses'}
          </p>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} locale={locale || 'ar'} />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'لا توجد كورسات مطابقة' : 'No matching courses'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function CourseCard({ course, locale }: { course: any; locale: string }) {
  const levelAr: Record<string, string> = {
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
    ALL_LEVELS: 'كل المستويات',
  };

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-video bg-muted relative">
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          )}
          {course.isFeatured && (
            <Badge className="absolute top-2 end-2">
              {locale === 'ar' ? 'مميز' : 'Featured'}
            </Badge>
          )}
          {course.price === 0 && (
            <Badge variant="secondary" className="absolute bottom-2 start-2">
              {locale === 'ar' ? 'مجاني' : 'Free'}
            </Badge>
          )}
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{levelAr[course.level] || course.level}</Badge>
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              <span>{course.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({course._count.reviews})</span>
            </div>
          </div>
          <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={course.teacher.image || ''} />
              <AvatarFallback>{course.teacher.name?.[0] || 'T'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{course.teacher.name}</span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course._count.enrollments}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.duration, locale)}
            </span>
          </div>
          <div className="text-end">
            {course.price === 0 ? (
              <span className="text-green-600 font-bold text-sm">
                {locale === 'ar' ? 'مجاني' : 'Free'}
              </span>
            ) : (
              <div>
                {course.comparePrice && (
                  <span className="text-xs text-muted-foreground line-through me-2">
                    {formatCurrency(course.comparePrice, locale)}
                  </span>
                )}
                <span className="font-bold">{formatCurrency(course.price, locale)}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
