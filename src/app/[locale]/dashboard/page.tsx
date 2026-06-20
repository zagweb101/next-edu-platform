/**
 * Dashboard overview — KPIs + recent activity
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, DollarSign, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { DashboardChart } from '@/components/dashboard/chart';

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const session = await auth();

  const [totalUsers, totalRevenue, paidPayments, activeSubs, recentPayments, recentUsers, recentLogs] =
    await Promise.all([
      db.user.count(),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      db.payment.count({ where: { status: 'PAID' } }),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      db.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  const revenue = totalRevenue._sum.amount ?? 0;

  const kpis = [
    {
      label: t('dashboard.totalUsers'),
      value: totalUsers.toString(),
      icon: Users,
      change: '+12%',
    },
    {
      label: t('dashboard.totalRevenue'),
      value: formatCurrency(revenue, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: DollarSign,
      change: '+23%',
    },
    {
      label: t('dashboard.activeSubscriptions'),
      value: activeSubs.toString(),
      icon: CreditCard,
      change: '+5%',
    },
    {
      label: t('payments.successfulPayments'),
      value: paidPayments.toString(),
      icon: TrendingUp,
      change: '+18%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: session?.user?.name || session?.user?.email })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.overview')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-emerald-600 font-medium">{kpi.change}</span>{' '}
                {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenueGrowth')}</CardTitle>
            <CardDescription>{t('dashboard.last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart type="revenue" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.userGrowth')}</CardTitle>
            <CardDescription>{t('dashboard.last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart type="users" />
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentPayments')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('payments.noPayments')}
              </p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {p.user?.name?.[0] || p.user?.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {p.user?.name || p.user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(p.amount, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                    <PaymentStatusBadge status={p.status} t={t} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('dashboard.recentActivity')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('audit.noLogs')}
              </p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {log.user?.name?.[0] || log.user?.email?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">
                      {log.user?.name || log.user?.email || 'system'}
                    </span>{' '}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</code>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.createdAt, locale)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-md border">
                <Avatar>
                  <AvatarFallback>{u.name?.[0] || u.email[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="outline">{t(`roles.${u.role}`)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentStatusBadge({
  status,
  t,
}: {
  status: string;
  t: (k: string) => string;
}) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PAID: 'default',
    PENDING: 'secondary',
    FAILED: 'destructive',
    REFUNDED: 'outline',
    INITIATED: 'secondary',
    CANCELED: 'outline',
  };
  const variant = map[status] || 'outline';
  return <Badge variant={variant}>{t(`payments.status${status.charAt(0)}${status.slice(1).toLowerCase()}`)}</Badge>;
}
