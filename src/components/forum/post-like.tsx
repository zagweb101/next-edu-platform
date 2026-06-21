'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostLikeProps {
  postId: string;
  likeCount: number;
  isLoggedIn: boolean;
  locale: string;
}

export function PostLike({ postId, likeCount, isLoggedIn, locale }: PostLikeProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  async function toggleLike() {
    if (!isLoggedIn) {
      toast({
        title: locale === 'ar' ? 'تنبيه' : 'Notice',
        description: locale === 'ar' ? 'سجل الدخول للإعجاب' : 'Login to like',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLiked(data.liked);
      setCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (e) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={loading}
      className={cn('text-xs', liked && 'text-primary')}
    >
      <ThumbsUp className={cn('h-3.5 w-3.5 me-1', liked && 'fill-current')} />
      {count}
    </Button>
  );
}
