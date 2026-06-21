'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, FileText, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatVideoTime, formatDuration } from '@/lib/format';

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  videoUrl?: string | null;
  videoProvider?: string | null;
  videoDuration: number;
  content?: string | null;
  pdfUrl?: string | null;
  quiz?: any;
}

interface LessonPlayerProps {
  lesson: Lesson;
  courseSlug: string;
  locale: string;
  enrollmentId?: string;
}

export function LessonPlayer({ lesson, courseSlug, locale, enrollmentId }: LessonPlayerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track progress every 10 seconds (for video lessons)
  useEffect(() => {
    if (lesson.type !== 'VIDEO' || !enrollmentId) return;

    intervalRef.current = setInterval(() => {
      setWatchedSeconds(prev => {
        const newSec = prev + 10;
        // Send progress update to server
        fetch(`/api/lessons/${lesson.id}/progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchedSeconds: newSec }),
        }).catch(() => {});
        return newSec;
      });
    }, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lesson.id, lesson.type, enrollmentId]);

  async function markComplete() {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, watchedSeconds: lesson.videoDuration }),
      });

      if (!res.ok) throw new Error('Failed to mark complete');

      const data = await res.json();
      toast({
        title: locale === 'ar' ? 'أحسنت!' : 'Great job!',
        description:
          locale === 'ar'
            ? `اكتمل الدرس. تقدمك: ${data.enrollmentProgress}%`
            : `Lesson completed. Progress: ${data.enrollmentProgress}%`,
      });
      router.refresh();
    } catch (e: any) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setMarkingComplete(false);
    }
  }

  // Render based on lesson type
  return (
    <div className="space-y-4">
      <Card>
        {/* Video */}
        {lesson.type === 'VIDEO' && lesson.videoUrl && (
          <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
            <VideoEmbed
              url={lesson.videoUrl}
              provider={lesson.videoProvider}
            />
          </div>
        )}

        {/* Article */}
        {lesson.type === 'ARTICLE' && (
          <CardContent className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans bg-muted/30 p-4 rounded-lg">
                {lesson.content || 'No content'}
              </pre>
            </div>
          </CardContent>
        )}

        {/* PDF */}
        {lesson.type === 'PDF' && lesson.pdfUrl && (
          <div className="aspect-[4/3] bg-muted rounded-t-lg flex items-center justify-center">
            <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <FileText className="h-4 w-4 me-2" />
                {locale === 'ar' ? 'عرض PDF' : 'View PDF'}
              </Button>
            </a>
          </div>
        )}

        {/* Quiz */}
        {lesson.type === 'QUIZ' && (
          <CardContent className="p-6">
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">
                {lesson.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar' ? 'هذا الدرس عبارة عن اختبار' : 'This lesson is a quiz'}
              </p>
              <Button onClick={() => router.push(`/courses/${courseSlug}/learn/quiz/${lesson.id}`)}>
                {locale === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz'}
              </Button>
            </div>
          </CardContent>
        )}

        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {lesson.type === 'VIDEO' && (locale === 'ar' ? 'فيديو' : 'Video')}
              {lesson.type === 'ARTICLE' && (locale === 'ar' ? 'مقال' : 'Article')}
              {lesson.type === 'PDF' && 'PDF'}
              {lesson.type === 'QUIZ' && (locale === 'ar' ? 'اختبار' : 'Quiz')}
            </Badge>
            {lesson.videoDuration > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(lesson.videoDuration, locale)}
              </span>
            )}
          </div>
          <CardTitle className="text-xl">{lesson.title}</CardTitle>
          {lesson.description && (
            <p className="text-muted-foreground text-sm">{lesson.description}</p>
          )}
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowRight className="h-4 w-4 me-2 rtl:rotate-180" />
            {locale === 'ar' ? 'السابق' : 'Previous'}
          </Button>

          <Button onClick={markComplete} disabled={markingComplete}>
            {markingComplete ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 me-2" />
            )}
            {locale === 'ar' ? 'إكمال الدرس' : 'Mark Complete'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoEmbed({ url, provider }: { url: string; provider?: string | null }) {
  // Convert YouTube watch URL to embed URL
  function getEmbedUrl(url: string, provider?: string | null): string {
    if (provider === 'youtube' || url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (provider === 'vimeo' || url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  }

  const embedUrl = getEmbedUrl(url, provider);

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Lesson video"
    />
  );
}
