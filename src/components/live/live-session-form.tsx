'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Radio } from 'lucide-react';

interface LiveSessionFormProps {
  courses: { id: string; title: string }[];
  locale: string;
}

export function LiveSessionForm({ courses, locale }: LiveSessionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    provider: 'WEBRTC',
    scheduledStart: '',
    scheduledEnd: '',
    // Zoom
    zoomMeetingId: '',
    zoomJoinUrl: '',
    zoomStartUrl: '',
    zoomPassword: '',
    // YouTube
    youtubeLiveUrl: '',
  });

  function setField(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledStart) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'يرجى ملء العنوان والموعد' : 'Please fill title and time',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      const live = await res.json();
      toast({
        title: locale === 'ar' ? 'تم!' : 'Success!',
        description: locale === 'ar' ? 'تم إنشاء الجلسة' : 'Session created',
      });
      router.push(`/live/${live.id}`);
      router.refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5" />
            {locale === 'ar' ? 'معلومات الجلسة' : 'Session Info'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              {locale === 'ar' ? 'عنوان الجلسة' : 'Session Title'} *
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: سؤال وجواب مباشر' : 'e.g. Live Q&A'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {locale === 'ar' ? 'الوصف' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">
                {locale === 'ar' ? 'تاريخ البداية' : 'Start Time'} *
              </Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                value={form.scheduledStart}
                onChange={e => setField('scheduledStart', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">
                {locale === 'ar' ? 'تاريخ النهاية' : 'End Time'}
              </Label>
              <Input
                id="scheduledEnd"
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={e => setField('scheduledEnd', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">
              {locale === 'ar' ? 'الكورس (اختياري)' : 'Course (optional)'}
            </Label>
            <Select value={form.courseId} onValueChange={v => setField('courseId', v)}>
              <SelectTrigger id="course">
                <SelectValue placeholder={locale === 'ar' ? 'اختر كورس' : 'Select course'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">
              {locale === 'ar' ? 'مزود البث' : 'Stream Provider'}
            </Label>
            <Select value={form.provider} onValueChange={v => setField('provider', v)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBRTC">WebRTC (built-in)</SelectItem>
                <SelectItem value="ZOOM">Zoom Meeting</SelectItem>
                <SelectItem value="YOUTUBE">YouTube Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Provider-specific fields */}
      {form.provider === 'ZOOM' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zoom Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoomMeetingId">Zoom Meeting ID</Label>
              <Input
                id="zoomMeetingId"
                value={form.zoomMeetingId}
                onChange={e => setField('zoomMeetingId', e.target.value)}
                placeholder="123 456 7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoomJoinUrl">Join URL</Label>
              <Input
                id="zoomJoinUrl"
                type="url"
                value={form.zoomJoinUrl}
                onChange={e => setField('zoomJoinUrl', e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoomPassword">Password (optional)</Label>
              <Input
                id="zoomPassword"
                value={form.zoomPassword}
                onChange={e => setField('zoomPassword', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {form.provider === 'YOUTUBE' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">YouTube Live Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="youtubeLiveUrl">YouTube Live Embed URL</Label>
            <Input
              id="youtubeLiveUrl"
              type="url"
              value={form.youtubeLiveUrl}
              onChange={e => setField('youtubeLiveUrl', e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {locale === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
          {locale === 'ar' ? 'إنشاء الجلسة' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
}
