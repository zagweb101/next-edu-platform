/**
 * Live sessions page — lists upcoming + live sessions
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Radio, Calendar, Users, Video, Plus } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { auth } from '@/lib/auth';

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  const [liveNow, upcoming] = await Promise.all([
    db.liveSession.findMany({
      where: { status: 'LIVE' },
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { actualStart: 'desc' },
    }),
    db.liveSession.findMany({
      where: { status: 'SCHEDULED' },
      include: {
        teacher: { select: { id: true, name: true, image: true } },
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    }),
  ]);

  const canCreate = session?.user && ['TEACHER', 'ADMIN'].includes(session.user.role);

  return (
    <main className="min-h-screen bg-muted/30">
      <section className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Radio className="h-8 w-8 text-red-600" />
                {locale === 'ar' ? 'البث المباشر' : 'Live Streaming'}
              </h1>
              <p className="text-muted-foreground">
                {locale === 'ar'
                  ? 'جلسات مباشرة مع أفضل المعلّمين — تفاعل واسأل في الوقت الحقيقي'
                  : 'Live sessions with top instructors — interact and ask in real-time'}
              </p>
            </div>
            {canCreate && (
              <Link href="/teach/live/new">
                <Button size="lg">
                  <Plus className="h-4 w-4 me-2" />
                  {locale === 'ar' ? 'إنشاء جلسة' : 'New Session'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Live now */}
        {liveNow.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              {locale === 'ar' ? 'مباشر الآن' : 'Live Now'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveNow.map(live => (
                <LiveCard key={live.id} live={live} locale={locale || 'ar'} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {locale === 'ar' ? 'القادمة' : 'Upcoming'}
          </h2>
          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Video className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(live => (
                <LiveCard key={live.id} live={live} locale={locale || 'ar'} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function LiveCard({ live, locale }: { live: any; locale: string }) {
  const isLive = live.status === 'LIVE';
  return (
    <Link href={`/live/${live.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-video bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950 dark:to-orange-950 relative flex items-center justify-center">
          <Video className="h-12 w-12 text-red-600/50" />
          {isLive && (
            <Badge className="absolute top-2 end-2 bg-red-600 hover:bg-red-700">
              <Radio className="h-3 w-3 me-1" />
              LIVE
            </Badge>
          )}
          <Badge variant="secondary" className="absolute top-2 start-2">
            {live.provider}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-base line-clamp-2">{live.title}</CardTitle>
          {live.course && (
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'الكورس:' : 'Course:'} {live.course.title}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={live.teacher.image || ''} />
              <AvatarFallback>{live.teacher.name?.[0] || 'T'}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{live.teacher.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {!isLive && (
              <span>{formatDate(live.scheduledStart, locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-red-600">
                <Users className="h-3.5 w-3.5" />
                {live._count.attendees} {locale === 'ar' ? 'مشاهد' : 'watching'}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            variant={isLive ? 'default' : 'outline'}
          >
            {isLive
              ? (locale === 'ar' ? 'انضم الآن' : 'Join Now')
              : (locale === 'ar' ? 'اضبط تذكير' : 'Set Reminder')}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
