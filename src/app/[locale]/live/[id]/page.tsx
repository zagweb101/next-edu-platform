/**
 * Live session detail/watch page — shows live stream + chat
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { LiveViewer } from '@/components/live/live-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Calendar, Users, Video } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ locale?: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  const live = await db.liveSession.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { id: true, name: true, image: true, title: true, bio: true },
      },
      course: { select: { id: true, title: true, slug: true } },
      _count: { select: { attendees: true } },
    },
  });

  if (!live) notFound();

  const isLive = live.status === 'LIVE';
  const isTeacher = session?.user?.id === live.teacherId;
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/live">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 me-2 rtl:rotate-180" />
              {locale === 'ar' ? 'كل الجلسات' : 'All sessions'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-red-600">
                <span className="relative flex h-2 w-2 me-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </Badge>
            )}
            <Badge variant="outline">{live.provider}</Badge>
            {isLive && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {live._count.attendees}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
        {/* Main content */}
        <div className="p-4 lg:p-6 space-y-4">
          <LiveViewer
            live={live}
            isTeacher={isTeacher}
            isAdmin={isAdmin}
            isLoggedIn={!!session?.user}
            locale={locale || 'ar'}
          />

          <Card>
            <CardHeader>
              <CardTitle>{live.title}</CardTitle>
              {live.description && (
                <p className="text-muted-foreground">{live.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={live.teacher.image || ''} />
                  <AvatarFallback>{live.teacher.name?.[0] || 'T'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{live.teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{live.teacher.title}</p>
                  {live.teacher.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{live.teacher.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — info */}
        <div className="border-s bg-card p-4 space-y-4">
          <div>
            <h3 className="font-bold mb-3">
              {locale === 'ar' ? 'التفاصيل' : 'Details'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {locale === 'ar' ? 'البداية' : 'Starts'}
                </span>
                <span>{formatDate(live.scheduledStart, locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {live.scheduledEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {locale === 'ar' ? 'النهاية' : 'Ends'}
                  </span>
                  <span>{formatDate(live.scheduledEnd, locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
              {live.course && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'الكورس' : 'Course'}</span>
                  <Link href={`/courses/${live.course.slug}`} className="text-primary hover:underline">
                    {live.course.title}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
