'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Prefs {
  notifyInApp?: boolean;
  notifyEmail?: boolean;
  notifyPush?: boolean;
}

export function NotificationPrefs({ initial }: { initial?: Prefs }) {
  const t = useTranslations();
  const [prefs, setPrefs] = useState<Prefs>(
    initial ?? { notifyInApp: true, notifyEmail: true, notifyPush: true },
  );
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('settings.saved'));
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test from your boilerplate dashboard.',
          type: 'info',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('notifications.testSent'));
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <PrefRow
          id="in-app"
          label={t('notifications.inAppNotifications')}
          checked={prefs.notifyInApp ?? true}
          onChange={(v) => setPrefs((p) => ({ ...p, notifyInApp: v }))}
        />
        <PrefRow
          id="email"
          label={t('notifications.emailNotifications')}
          checked={prefs.notifyEmail ?? true}
          onChange={(v) => setPrefs((p) => ({ ...p, notifyEmail: v }))}
        />
        <PrefRow
          id="push"
          label={t('notifications.pushNotifications')}
          checked={prefs.notifyPush ?? true}
          onChange={(v) => setPrefs((p) => ({ ...p, notifyPush: v }))}
        />
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {t('settings.save')}
        </Button>
        <Button variant="outline" onClick={sendTest} disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {t('notifications.testNotification')}
        </Button>
      </div>
    </div>
  );
}

function PrefRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
