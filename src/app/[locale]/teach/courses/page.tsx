/**
 * Teacher courses list page
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Users, Star, Edit3, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

export default async function TeacherCoursesPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/teach/courses`);
  }

  if (!['TEACHER', 'ADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/forbidden`);
  }

  const courses = await db.course.findMany({
    where: session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id },
    include: {
      _count: { select: { enrollments: true, reviews: true, modules: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'ar' ? 'كورساتي' : 'My Courses'}
          </h1>
          <p className="text-muted-foreground">
            {courses.length} {locale === 'ar' ? 'كورس' : 'courses'}
          </p>
        </div>
        <Link href="/teach/courses/new">
          <Button size="lg">
            <Plus className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'إنشاء كورس' : 'New Course'}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="py-16 text-center">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === 'ar' ? 'الكورس' : 'Course'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-center">
                    {locale === 'ar' ? 'الطلاب' : 'Students'}
                  </TableHead>
                  <TableHead className="text-center">
                    {locale === 'ar' ? 'التقييم' : 'Rating'}
                  </TableHead>
                  <TableHead>{locale === 'ar' ? 'السعر' : 'Price'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                          {course.thumbnail && (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/teach/courses/${course.slug}`} className="font-medium hover:underline truncate block">
                            {course.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {course._count.modules} {locale === 'ar' ? 'وحدات' : 'modules'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.status === 'PUBLISHED' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {locale === 'ar' ? 'منشور' : 'Published'}
                        </Badge>
                      ) : course.status === 'DRAFT' ? (
                        <Badge variant="outline">{locale === 'ar' ? 'مسودة' : 'Draft'}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          {locale === 'ar' ? 'مؤرشف' : 'Archived'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {course._count.enrollments}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                        {course.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {course.price === 0
                        ? <span className="text-green-600">{locale === 'ar' ? 'مجاني' : 'Free'}</span>
                        : formatCurrency(course.price, locale)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(course.createdAt, locale, { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/courses/${course.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/teach/courses/${course.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
