import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default async function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('auth.forbidden')}</h1>
          <p className="text-muted-foreground">{t('auth.forbiddenDesc')}</p>
        </div>
        <Link href="/dashboard">
          <Button>{t('dashboard.title')}</Button>
        </Link>
      </div>
    </main>
  );
}
