'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface PostReplyProps {
  topicId: string;
  locale: string;
}

export function PostReply({ topicId, locale }: PostReplyProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      toast({
        title: locale === 'ar' ? 'تم!' : 'Success!',
        description: locale === 'ar' ? 'تم نشر الرد' : 'Reply posted',
      });
      setContent('');
      router.refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={locale === 'ar' ? 'اكتب ردك...' : 'Write your reply...'}
            rows={4}
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
              {locale === 'ar' ? 'نشر الرد' : 'Post Reply'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
