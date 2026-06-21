/**
 * Teacher dashboard — Overview
 * Shows teacher's stats: total courses, students, revenue, avg rating
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen, Users, DollarSign, Star, Plus, TrendingUp,
  Clock, BookMarked,
} from 'lucide-react';
import { formatCurrency, formatRelative } from '@/lib/format';

export default async function TeacherDashboard({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/teach`);
  }

  if (!['TEACHER', 'ADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }

  // Get teacher's courses (or all courses if admin)
  const courses = await db.course.findMany({
    where: session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id },
    include: {
      teacher: { select: { id: true, name: true, image: true } },
      _count: { select: { enrollments: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter(c => c.status === 'DRAFT').length;
  const totalStudents = courses.reduce((sum, c) => sum + c.enrollmentsCount, 0);
  const avgRating = courses.length > 0
    ? courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
    : 0;

  // Total revenue
  const revenue = await db.payment.aggregate({
    where: {
      status: 'PAID',
      ...(session.user.role !== 'ADMIN' && {
        enrollment: { course: { teacherId: session.user.id } },
      }),
    },
    _sum: { amount: true },
  });

  // Recent enrollments
  const recentEnrollments = await db.enrollment.findMany({
    where: {
      ...(session.user.role !== 'ADMIN' && {
        course: { teacherId: session.user.id },
      }),
    },
    include: {
      student: { select: { id: true, name: true, image: true } },
      course: { select: { id: true, title: true, slug: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const stats = [
    {
      label: locale === 'ar' ? 'الكورسات' : 'Courses',
      value: totalCourses,
      sublabel: `${publishedCourses} ${locale === 'ar' ? 'منشور' : 'published'}, ${draftCourses} ${locale === 'ar' ? 'مسودة' : 'draft'}`,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: locale === 'ar' ? 'الطلاب' : 'Students',
      value: totalStudents,
      sublabel: locale === 'ar' ? 'إجمالي المسجلين' : 'Total enrolled',
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: locale === 'ar' ? 'الإيرادات' : 'Revenue',
      value: formatCurrency(revenue._sum.amount || 0, locale),
      sublabel: locale === 'ar' ? 'إجمالي المدفوعات' : 'Total payments',
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: locale === 'ar' ? 'متوسط التقييم' : 'Avg Rating',
      value: `${avgRating.toFixed(1)} ★`,
      sublabel: `${courses.reduce((s, c) => s + c._count.reviews, 0)} ${locale === 'ar' ? 'تقييم' : 'reviews'}`,
      icon: Star,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'ar' ? 'لوحة المعلّم' : 'Teacher Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'ar'
              ? `مرحباً ${session.user.name}! إدارة كورساتك وطلابك`
              : `Welcome ${session.user.name}! Manage your courses and students`}
          </p>
        </div>
        <Link href="/teach/courses/new">
          <Button size="lg">
            <Plus className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'إنشاء كورس' : 'New Course'}
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sublabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses + Recent Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'كورساتي' : 'My Courses'}
                </CardTitle>
                <Link href="/teach/courses">
                  <Button variant="ghost" size="sm">
                    {locale === 'ar' ? 'عرض الكل' : 'View all'}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {courses.length === 0 ? (
                <div className="py-12 text-center">
                  <BookMarked className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    {locale === 'ar' ? 'لم تنشئ أي كورس بعد' : 'No courses yet'}
                  </p>
                  <Link href="/teach/courses/new">
                    <Button>
                      <Plus className="h-4 w-4 me-2" />
                      {locale === 'ar' ? 'إنشاء أول كورس' : 'Create your first course'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {courses.slice(0, 5).map(course => (
                    <Link
                      key={course.id}
                      href={`/teach/courses/${course.slug}`}
                      className="block p-4 hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                          {course.thumbnail && (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{course.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course._count.enrollments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {course.rating.toFixed(1)}
                            </span>
                            {course.status === 'PUBLISHED' ? (
                              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                {locale === 'ar' ? 'منشور' : 'Published'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {locale === 'ar' ? 'مسودة' : 'Draft'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="font-bold">
                            {course.price === 0
                              ? (locale === 'ar' ? 'مجاني' : 'Free')
                              : formatCurrency(course.price, locale)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent enrollments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === 'ar' ? 'تسجيلات حديثة' : 'Recent Enrollments'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentEnrollments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد تسجيلات' : 'No enrollments yet'}
                </p>
              ) : (
                <div className="divide-y">
                  {recentEnrollments.map(enr => (
                    <div key={enr.id} className="p-4 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={enr.student.image || ''} />
                        <AvatarFallback>{enr.student.name?.[0] || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{enr.student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {enr.course.title}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(enr.createdAt, locale)}
                        </p>
                        <p className="text-xs font-medium">
                          {enr.course.price === 0
                            ? (locale === 'ar' ? 'مجاني' : 'Free')
                            : formatCurrency(enr.course.price, locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
