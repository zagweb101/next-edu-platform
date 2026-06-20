/**
 * Landing page — showcase the boilerplate features
 * This is the public home page that introduces the boilerplate.
 * Authenticated users see a CTA to dashboard, others see login/signup.
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  CreditCard,
  Bell,
  BarChart3,
  Globe,
  Database,
  Rocket,
  Code2,
  Lock,
  Users,
} from 'lucide-react';
import { auth } from '@/lib/auth';

const FEATURES = [
  {
    icon: ShieldCheck,
    titleKey: 'auth',
    descAr: 'مصادقة كاملة بـ NextAuth v5 مع Google و GitHub و RBAC',
    descEn: 'Full NextAuth v5 with Google, GitHub, and RBAC',
  },
  {
    icon: CreditCard,
    titleKey: 'payments',
    descAr: 'تكامل Moyasar للدفع (مدى + Apple Pay + STC Pay)',
    descEn: 'Moyasar payments (mada + Apple Pay + STC Pay)',
  },
  {
    icon: Bell,
    titleKey: 'notifications',
    descAr: 'إشعارات in-app + Email (Resend) + Push (FCM) عبر BullMQ',
    descEn: 'In-app + Email (Resend) + Push (FCM) via BullMQ',
  },
  {
    icon: BarChart3,
    titleKey: 'analytics',
    descAr: 'لوحة تحكم احترافية بـ KPIs و Charts و إدارة مستخدمين',
    descEn: 'Pro dashboard with KPIs, charts, user management',
  },
  {
    icon: Globe,
    titleKey: 'i18n',
    descAr: 'دعم العربية والإنجليزية مع RTL/LTR تلقائي',
    descEn: 'Arabic + English with automatic RTL/LTR',
  },
  {
    icon: Database,
    titleKey: 'database',
    descAr: 'Prisma ORM مع PostgreSQL (Railway) أو SQLite (dev)',
    descEn: 'Prisma ORM with PostgreSQL (Railway) or SQLite (dev)',
  },
  {
    icon: Lock,
    titleKey: 'security',
    descAr: 'Audit logs + rate limiting + Sentry + structured logging',
    descEn: 'Audit logs + rate limiting + Sentry + structured logging',
  },
  {
    icon: Rocket,
    titleKey: 'deploy',
    descAr: 'جاهز للنشر على Railway مع PR previews و CI/CD',
    descEn: 'Railway-ready with PR previews and CI/CD',
  },
];

const TECH_STACK = [
  'Next.js 16',
  'TypeScript 5',
  'Tailwind CSS 4',
  'shadcn/ui',
  'Prisma 6',
  'NextAuth v5',
  'next-intl',
  'Moyasar',
  'Resend',
  'Firebase FCM',
  'BullMQ + Redis',
  'Pino + Sentry',
  'UploadThing',
  'Vitest + Playwright',
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const session = await auth();
  const isAuthed = !!session?.user;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6" />
            <span className="font-bold text-lg">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Boilerplate'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <Link href="/dashboard">
                <Button>{t('dashboard.title')}</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">{t('auth.login')}</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>{t('auth.register')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          {locale === 'ar' ? 'إنتاج الجاهز' : 'Production-ready'}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          {locale === 'ar'
            ? 'ابدأ مشروعك القادم في دقائق'
            : 'Ship your next project in minutes'}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {locale === 'ar'
            ? 'Boilerplate متكامل بـ Next.js 16 فيه المصادقة، الدفع، الإشعارات، لوحات التحكم، i18n، وكل اللي تحتاجه للإنتاج.'
            : 'A complete Next.js 16 boilerplate with auth, payments, notifications, dashboards, i18n, and everything you need for production.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {isAuthed ? (
            <Link href="/dashboard">
              <Button size="lg">
                {t('dashboard.title')}
                <Rocket className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/register">
                <Button size="lg">
                  {t('auth.register')}
                  <Rocket className="ms-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  {t('auth.login')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {locale === 'ar' ? 'كل ما تحتاجه في مكان واحد' : 'Everything you need in one place'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.titleKey} className="border-border/60">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.titleKey}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? f.descAr : f.descEn}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {locale === 'ar' ? 'التقنيات المستخدمة' : 'Powered by'}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {TECH_STACK.map((tech) => (
            <Badge key={tech} variant="outline" className="text-sm py-2 px-3">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {locale === 'ar'
              ? 'مبني بـ ❤️ باستخدام Next.js و TypeScript'
              : 'Built with ❤️ using Next.js and TypeScript'}
          </p>
        </div>
      </footer>
    </main>
  );
}
