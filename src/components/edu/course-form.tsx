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
import { Loader2, Save } from 'lucide-react';

interface CourseFormProps {
  locale: string;
  mode: 'create' | 'edit';
  initialData?: {
    title?: string;
    description?: string;
    price?: number;
    comparePrice?: number;
    level?: string;
    language?: string;
    thumbnail?: string;
    whatYouLearn?: string;
    requirements?: string;
  };
  courseSlug?: string;
}

export function CourseForm({ locale, mode, initialData, courseSlug }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price ?? 0,
    comparePrice: initialData?.comparePrice ?? 0,
    level: initialData?.level || 'BEGINNER',
    language: initialData?.language || 'ar',
    thumbnail: initialData?.thumbnail || '',
    whatYouLearn: initialData?.whatYouLearn || '',
    requirements: initialData?.requirements || '',
  });

  function setField(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/courses'
        : `/api/courses/${courseSlug}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save course');
      }

      const course = await res.json();

      toast({
        title: locale === 'ar' ? 'تم بنجاح!' : 'Success!',
        description: mode === 'create'
          ? (locale === 'ar' ? 'تم إنشاء الكورس. أضف الدروس الآن.' : 'Course created. Add lessons now.')
          : (locale === 'ar' ? 'تم تحديث الكورس' : 'Course updated'),
      });

      // Redirect to course edit page (to add lessons)
      router.push(`/teach/courses/${course.slug}`);
      router.refresh();
    } catch (e: any) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              {locale === 'ar' ? 'عنوان الكورس' : 'Course Title'} *
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: أساسيات React من الصفر' : 'e.g. React Basics from Scratch'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {locale === 'ar' ? 'وصف الكورس' : 'Course Description'} *
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder={locale === 'ar' ? 'وصف تفصيلي لما سيتعلمه الطالب' : 'Detailed description of what students will learn'}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">
                {locale === 'ar' ? 'المستوى' : 'Level'}
              </Label>
              <Select value={form.level} onValueChange={v => setField('level', v)}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">{locale === 'ar' ? 'مبتدئ' : 'Beginner'}</SelectItem>
                  <SelectItem value="INTERMEDIATE">{locale === 'ar' ? 'متوسط' : 'Intermediate'}</SelectItem>
                  <SelectItem value="ADVANCED">{locale === 'ar' ? 'متقدم' : 'Advanced'}</SelectItem>
                  <SelectItem value="ALL_LEVELS">{locale === 'ar' ? 'كل المستويات' : 'All Levels'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                {locale === 'ar' ? 'اللغة' : 'Language'}
              </Label>
              <Select value={form.language} onValueChange={v => setField('language', v)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{locale === 'ar' ? 'العربية' : 'Arabic'}</SelectItem>
                  <SelectItem value="en">{locale === 'ar' ? 'الإنجليزية' : 'English'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">
              {locale === 'ar' ? 'صورة الكورس (URL)' : 'Course Thumbnail (URL)'}
            </Label>
            <Input
              id="thumbnail"
              value={form.thumbnail}
              onChange={e => setField('thumbnail', e.target.value)}
              placeholder="https://..."
              type="url"
            />
            {form.thumbnail && (
              <div className="mt-2 w-40 aspect-video rounded overflow-hidden bg-muted">
                <img src={form.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === 'ar' ? 'التسعير' : 'Pricing'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              {locale === 'ar' ? 'السعر (ر.س) — 0 = مجاني' : 'Price (SAR) — 0 = Free'}
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={e => setField('price', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'ضع 0 إذا كان الكورس مجانياً' : 'Set to 0 for free course'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comparePrice">
              {locale === 'ar' ? 'السعر قبل الخصم (اختياري)' : 'Compare-at Price (optional)'}
            </Label>
            <Input
              id="comparePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.comparePrice || ''}
              onChange={e => setField('comparePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === 'ar' ? 'المحتوى التعليمي' : 'Learning Content'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatYouLearn">
              {locale === 'ar' ? 'ماذا سيتعلم الطالب؟' : 'What will students learn?'}
            </Label>
            <Textarea
              id="whatYouLearn"
              value={form.whatYouLearn}
              onChange={e => setField('whatYouLearn', e.target.value)}
              placeholder={locale === 'ar'
                ? 'كل نقطة في سطر جديد\nمثال:\nفهم أساسيات React\nبناء تطبيق كامل\nالتعامل مع APIs'
                : 'Each point on a new line\nExample:\nUnderstand React fundamentals\nBuild a complete app\nWork with APIs'}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">
              {locale === 'ar' ? 'المتطلبات' : 'Requirements'}
            </Label>
            <Textarea
              id="requirements"
              value={form.requirements}
              onChange={e => setField('requirements', e.target.value)}
              placeholder={locale === 'ar'
                ? 'كل متطلب في سطر\nمثال:\nمعرفة بـ HTML\nمعرفة بـ JavaScript'
                : 'Each requirement on a new line\nExample:\nHTML knowledge\nJavaScript basics'}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {locale === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin me-2" />
          ) : (
            <Save className="h-4 w-4 me-2" />
          )}
          {mode === 'create'
            ? (locale === 'ar' ? 'إنشاء الكورس' : 'Create Course')
            : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </Button>
      </div>
    </form>
  );
}
