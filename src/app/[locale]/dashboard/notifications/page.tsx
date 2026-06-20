/**
 * Notifications dashboard page — full list + notification preferences
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationsList } from '@/components/dashboard/notifications-list';
import { NotificationPrefs } from '@/components/dashboard/notification-prefs';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) return null;

  const [notifications, prefs] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id, channel: 'IN_APP' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { notifyInApp: true, notifyEmail: true, notifyPush: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t('notifications.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar'
            ? 'استعرض إشعاراتك وعدّل تفضيلاتك'
            : 'View your notifications and manage preferences'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationsList initial={notifications} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPrefs initial={prefs ?? undefined} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
