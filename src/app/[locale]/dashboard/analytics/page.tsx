/**
 * Analytics page — KPIs + charts (manager+)
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardChart } from '@/components/dashboard/chart';
import { Users, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  await requireRole('MANAGER');

  const [totalUsers, totalRevenue, paidCount, subsCount] = await Promise.all([
    db.user.count(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    db.payment.count({ where: { status: 'PAID' } }),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
  ]);

  const revenue = totalRevenue._sum.amount ?? 0;

  const kpis = [
    { label: t('dashboard.totalUsers'), value: totalUsers.toString(), icon: Users, change: '+12%' },
    {
      label: t('dashboard.totalRevenue'),
      value: formatCurrency(revenue, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: DollarSign,
      change: '+23%',
    },
    {
      label: t('payments.successfulPayments'),
      value: paidCount.toString(),
      icon: CreditCard,
      change: '+18%',
    },
    {
      label: t('dashboard.activeSubscriptions'),
      value: subsCount.toString(),
      icon: TrendingUp,
      change: '+5%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('dashboard.analytics')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar'
            ? 'تحليلات شاملة لأداء النظام'
            : 'Comprehensive analytics for your platform'}
        </p>
      </div>

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
              <p className="text-xs text-emerald-600 font-medium mt-1">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
