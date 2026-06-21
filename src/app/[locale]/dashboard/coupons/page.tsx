/**
 * Admin: Coupons management page
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Ticket, Edit3, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/format';

export default async function CouponsAdminPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/coupons`);
  }

  if (session.user.role !== 'ADMIN') {
    redirect(`/${locale}/forbidden`);
  }

  const coupons = await db.coupon.findMany({
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Ticket className="h-7 w-7" />
            {locale === 'ar' ? 'كوبونات الخصم' : 'Coupon Codes'}
          </h1>
          <p className="text-muted-foreground">
            {coupons.length} {locale === 'ar' ? 'كوبون' : 'coupons'}
          </p>
        </div>
        <Button size="lg">
          <Plus className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'كوبون جديد' : 'New Coupon'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <div className="py-12 text-center">
              <Ticket className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {locale === 'ar' ? 'لا توجد كوبونات بعد' : 'No coupons yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === 'ar' ? 'الكود' : 'Code'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'القيمة' : 'Value'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'الكورس' : 'Course'}</TableHead>
                  <TableHead className="text-center">{locale === 'ar' ? 'الاستخدام' : 'Usage'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'ينتهي' : 'Expires'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {c.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {c.type === 'PERCENTAGE' ? '%' : 'SAR'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : formatCurrency(c.value, locale)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.course?.title || (locale === 'ar' ? 'كل الكورسات' : 'All courses')}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {c._count.usages}
                      {c.maxUses > 0 && ` / ${c.maxUses}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.validUntil ? formatDate(c.validUntil, locale, { dateStyle: 'short' }) : '—'}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge className="bg-green-600">{locale === 'ar' ? 'نشط' : 'Active'}</Badge>
                      ) : (
                        <Badge variant="secondary">{locale === 'ar' ? 'متوقف' : 'Inactive'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
