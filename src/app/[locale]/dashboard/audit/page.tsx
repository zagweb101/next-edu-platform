/**
 * Audit log page (admin only)
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const t = await getTranslations();
  await requireRole('ADMIN');

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Group actions by category for filtering
  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('audit.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar'
            ? 'سجل كل الإجراءات الحساسة في النظام'
            : 'Track every sensitive action in the system'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('audit.title')}</CardTitle>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {actions.map((a) => (
              <Badge key={a} variant="outline" className="text-xs font-mono">
                {a}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start py-2 px-3 font-medium">{t('audit.action')}</th>
                  <th className="text-start py-2 px-3 font-medium">{t('audit.user')}</th>
                  <th className="text-start py-2 px-3 font-medium hidden md:table-cell">{t('audit.entity')}</th>
                  <th className="text-start py-2 px-3 font-medium hidden lg:table-cell">{t('audit.ipAddress')}</th>
                  <th className="text-start py-2 px-3 font-medium">{t('audit.date')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('audit.noLogs')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</code>
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {log.user?.name || log.user?.email || 'system'}
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell text-xs">
                        {log.entity ? `${log.entity}:${log.entityId ?? ''}` : '—'}
                      </td>
                      <td className="py-2 px-3 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {formatDate(log.createdAt, locale)}
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
