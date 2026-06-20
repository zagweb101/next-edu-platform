/**
 * Payments dashboard page
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { DollarSign, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) return null;

  const isManager = can(session.user.role, 'MANAGER');
  const where = isManager ? {} : { userId: session.user.id };

  const [payments, stats] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.payment.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = stats.find((s) => s.status === 'PAID')?._sum.amount ?? 0;
  const successful = stats.find((s) => s.status === 'PAID')?._count ?? 0;
  const failed = stats.find((s) => s.status === 'FAILED')?._count ?? 0;
  const avgOrder = successful ? totalRevenue / successful : 0;

  const kpis = [
    {
      label: t('payments.totalRevenue'),
      value: formatCurrency(totalRevenue, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: DollarSign,
    },
    {
      label: t('payments.successfulPayments'),
      value: successful.toString(),
      icon: CheckCircle2,
    },
    {
      label: t('payments.failedPayments'),
      value: failed.toString(),
      icon: XCircle,
    },
    {
      label: t('payments.averageOrderValue'),
      value: formatCurrency(avgOrder, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('payments.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {isManager
            ? 'View and manage all payments across the platform'
            : 'View your payment history'}
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('payments.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start py-2 px-3 font-medium">{t('payments.description')}</th>
                  {isManager && (
                    <th className="text-start py-2 px-3 font-medium hidden md:table-cell">User</th>
                  )}
                  <th className="text-start py-2 px-3 font-medium">{t('payments.amount')}</th>
                  <th className="text-start py-2 px-3 font-medium hidden sm:table-cell">{t('payments.method')}</th>
                  <th className="text-start py-2 px-3 font-medium">{t('payments.status')}</th>
                  <th className="text-start py-2 px-3 font-medium hidden lg:table-cell">{t('payments.date')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('payments.noPayments')}
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-3 max-w-[200px] truncate">{p.description ?? '—'}</td>
                      {isManager && (
                        <td className="py-2 px-3 hidden md:table-cell text-xs">
                          {p.user?.name || p.user?.email}
                        </td>
                      )}
                      <td className="py-2 px-3 font-medium">
                        {formatCurrency(p.amount, locale === 'ar' ? 'ar-SA' : 'en-US', p.currency)}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell text-xs">
                        {p.method ? t(`payments.method${p.method.charAt(0)}${p.method.slice(1).toLowerCase()}`) : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <PaymentStatusBadge status={p.status} t={t} />
                      </td>
                      <td className="py-2 px-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(p.createdAt, locale)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentStatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PAID: 'default',
    PENDING: 'secondary',
    FAILED: 'destructive',
    REFUNDED: 'outline',
    INITIATED: 'secondary',
    CANCELED: 'outline',
  };
  return (
    <Badge variant={map[status] || 'outline'}>
      {t(`payments.status${status.charAt(0)}${status.slice(1).toLowerCase()}`)}
    </Badge>
  );
}
