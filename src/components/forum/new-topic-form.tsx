'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

interface NewTopicFormProps {
  categories: { id: string; name: string }[];
  locale: string;
}

export function NewTopicForm({ categories, locale }: NewTopicFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    categoryId: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content || !form.categoryId) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      const topic = await res.json();
      toast({
        title: locale === 'ar' ? 'تم!' : 'Success!',
        description: locale === 'ar' ? 'تم نشر الموضوع' : 'Topic posted',
      });
      router.push(`/forum/${topic.slug}`);
      router.refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              {locale === 'ar' ? 'القسم' : 'Category'} *
            </Label>
            <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
              <SelectTrigger id="categoryId">
                <SelectValue placeholder={locale === 'ar' ? 'اختر قسم' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              {locale === 'ar' ? 'عنوان الموضوع' : 'Topic Title'} *
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder={locale === 'ar' ? 'مثال: كيف أتعلم React بفعالية؟' : 'e.g. How to learn React effectively?'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              {locale === 'ar' ? 'المحتوى' : 'Content'} *
            </Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={10}
              placeholder={locale === 'ar' ? 'اكتب موضوعك بالتفصيل...' : 'Write your topic in detail...'}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
              {locale === 'ar' ? 'نشر الموضوع' : 'Post Topic'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
