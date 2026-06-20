'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/format';
import { useLocale } from 'next-intl';
import { Check, BellOff, Info, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  status: string;
  createdAt: string;
}

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertOctagon,
} as const;

const COLORS = {
  info: 'text-blue-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
} as const;

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const t = useTranslations();
  const locale = useLocale() as 'ar' | 'en';
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'page'],
    initialData: { items: initial },
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=50');
      const data = await res.json();
      return { items: data.items ?? [] };
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('notifications.noNotifications')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((n) => {
        const Icon = ICONS[n.type as keyof typeof ICONS] || Info;
        const color = COLORS[n.type as keyof typeof COLORS] || 'text-blue-500';
        const isUnread = n.status !== 'READ';
        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-3 rounded-md ${
              isUnread ? 'bg-accent/40' : ''
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                {n.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {formatRelative(n.createdAt, locale)}
              </p>
            </div>
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => markReadMutation.mutate(n.id)}
                title={t('notifications.markRead')}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
