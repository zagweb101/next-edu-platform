/**
 * Settings page — admin only (system-wide settings)
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  await requireRole('ADMIN');

  const services = [
    { name: 'PostgreSQL / SQLite', env: 'DATABASE_URL', required: true },
    { name: 'NextAuth', env: 'AUTH_SECRET', required: true },
    { name: 'Moyasar', env: 'MOYASAR_SECRET_KEY', required: false },
    { name: 'Resend', env: 'RESEND_API_KEY', required: false },
    { name: 'Firebase FCM', env: 'FIREBASE_PROJECT_ID', required: false },
    { name: 'Redis', env: 'REDIS_URL', required: false },
    { name: 'Sentry', env: 'SENTRY_DSN', required: false },
    { name: 'UploadThing', env: 'UPLOADTHING_SECRET', required: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar'
            ? 'إعدادات النظام وحالة الخدمات'
            : 'System settings and service status'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            {locale === 'ar'
              ? 'حالة كل خدمة خارجية متصلة'
              : 'Status of each connected external service'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => {
              const configured = Boolean(process.env[s.env]);
              return (
                <div key={s.env} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.env}</p>
                  </div>
                  <Badge variant={configured ? 'default' : 'secondary'}>
                    {configured ? '✓ Configured' : 'Not set'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar'
              ? 'يمكن للأعضاء تعديل ملفهم الشخصي من صفحة الإشعارات.'
              : 'Members can edit their profile from the notifications page.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
