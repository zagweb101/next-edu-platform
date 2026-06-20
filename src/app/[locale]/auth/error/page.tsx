import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default async function ErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const { error } = await searchParams;

  const errorMessages: Record<string, { ar: string; en: string }> = {
    Configuration: {
      ar: 'خطأ في إعدادات الخادم. تواصل مع المدير.',
      en: 'Server configuration error. Contact admin.',
    },
    AccessDenied: {
      ar: 'تم رفض الوصول.',
      en: 'Access denied.',
    },
    Verification: {
      ar: 'الرابط غير صالح أو منتهي الصلاحية.',
      en: 'Invalid or expired link.',
    },
    OAuthSignin: {
      ar: 'فشل تسجيل الدخول عبر المزود.',
      en: 'OAuth sign-in failed.',
    },
    Callback: {
      ar: 'فشل استدعاء المصادقة.',
      en: 'Callback failed.',
    },
    default: {
      ar: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
      en: 'An unexpected error occurred. Try again.',
    },
  };

  const msg = errorMessages[error || 'default'] || errorMessages.default;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle>{t('auth.loginError')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar' ? msg.ar : msg.en}
          </p>
          {error && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
