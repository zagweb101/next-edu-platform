/**
 * Affiliate dashboard page — for users to view their referral stats + link
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrCreateAffiliate } from '@/lib/affiliate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, MousePointerClick, DollarSign, TrendingUp } from 'lucide-react';
import { CopyButton } from '@/components/affiliate/copy-button';
import { formatCurrency, formatRelative } from '@/lib/format';

export default async function AffiliatePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/affiliate`);
  }

  // Get or create affiliate account
  let affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
  });

  if (!affiliate) {
    affiliate = await getOrCreateAffiliate(session.user.id, session.user.name || undefined);
  }

  // Recent conversions
  const recentConversions = await db.affiliateConversion.findMany({
    where: { affiliateId: affiliate.id },
    include: {
      course: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentPayouts = await db.affiliatePayout.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${affiliate.referralCode}`;

  const stats = [
    {
      label: locale === 'ar' ? 'النقرات' : 'Clicks',
      value: affiliate.totalClicks,
      icon: MousePointerClick,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: locale === 'ar' ? 'التسجيلات' : 'Signups',
      value: affiliate.totalSignups,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: locale === 'ar' ? 'التحويلات' : 'Conversions',
      value: affiliate.totalConversions,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: locale === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings',
      value: formatCurrency(affiliate.totalEarnings, locale),
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'برنامج التسويق بالعمولة' : 'Affiliate Program'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'شارك رابطك واربح عمولة على كل تحويل'
            : 'Share your link and earn commission on every conversion'}
        </p>
      </div>

      {/* Referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === 'ar' ? 'رابط الإحالة' : 'Your Referral Link'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {referralUrl}
            </div>
            <CopyButton text={referralUrl} locale={locale} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {locale === 'ar'
              ? `عمولتك: ${affiliate.commissionRate}% من كل عملية شراء عبر رابطك`
              : `Your commission: ${affiliate.commissionRate}% of every purchase made via your link`}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending vs paid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {locale === 'ar' ? 'الرصيد المعلق' : 'Pending Balance'}
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(affiliate.pendingBalance, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {locale === 'ar' ? 'المدفوع' : 'Paid Out'}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(affiliate.paidOut, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {locale === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(affiliate.totalEarnings, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent conversions + payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'آخر التحويلات' : 'Recent Conversions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentConversions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {locale === 'ar' ? 'لا توجد تحويلات بعد' : 'No conversions yet'}
              </p>
            ) : (
              <div className="divide-y">
                {recentConversions.map(conv => (
                  <div key={conv.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {conv.course?.title || (locale === 'ar' ? 'تسجيل' : 'Signup')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.user?.name || '—'} • {formatRelative(conv.createdAt, locale)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-green-600">
                        +{formatCurrency(conv.commission, locale)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {conv.status === 'PENDING_PAYOUT'
                          ? (locale === 'ar' ? 'معلق' : 'Pending')
                          : conv.status === 'PAID'
                          ? (locale === 'ar' ? 'مدفوع' : 'Paid')
                          : conv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'سجل المدفوعات' : 'Payout History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayouts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {locale === 'ar' ? 'لا توجد مدفوعات بعد' : 'No payouts yet'}
              </p>
            ) : (
              <div className="divide-y">
                {recentPayouts.map(payout => (
                  <div key={payout.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(payout.amount, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(payout.createdAt, locale)} • {payout.method}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
