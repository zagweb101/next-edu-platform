/**
 * Forum topic detail page — shows topic + posts + reply form
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostReply } from '@/components/forum/post-reply';
import { PostLike } from '@/components/forum/post-like';
import { Pin, Lock, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatRelative } from '@/lib/format';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  const topic = await db.forumTopic.findUnique({
    where: { slug },
    include: {
      category: true,
      author: { select: { id: true, name: true, image: true, title: true } },
      course: { select: { id: true, title: true, slug: true } },
      posts: {
        include: {
          author: { select: { id: true, name: true, image: true, title: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!topic) notFound();

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Topic header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {topic.isPinned && (
                <Badge variant="secondary">
                  <Pin className="h-3 w-3 me-1" />
                  {locale === 'ar' ? 'مثبت' : 'Pinned'}
                </Badge>
              )}
              {topic.isLocked && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 me-1" />
                  {locale === 'ar' ? 'مقفل' : 'Locked'}
                </Badge>
              )}
              {topic.isSolved && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 me-1" />
                  {locale === 'ar' ? 'تم الحل' : 'Solved'}
                </Badge>
              )}
              {topic.category && (
                <Badge variant="outline">{topic.category.name}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{topic.title}</h1>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={topic.author.image || ''} />
                <AvatarFallback>{topic.author.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{topic.author.name}</span>
                  {topic.author.title && (
                    <span className="text-xs text-muted-foreground">• {topic.author.title}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    • {formatRelative(topic.createdAt, locale)}
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{topic.content}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts / replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {topic.posts.length} {locale === 'ar' ? 'رد' : 'replies'}
          </h2>

          {topic.posts.map((post, idx) => (
            <Card key={post.id} className={post.isSolution ? 'border-green-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={post.author.image || ''} />
                    <AvatarFallback>{post.author.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{post.author.name}</span>
                      {post.author.title && (
                        <span className="text-xs text-muted-foreground">• {post.author.title}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        • {formatRelative(post.createdAt, locale)}
                      </span>
                      {post.isSolution && (
                        <Badge className="bg-green-600 ms-auto">
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          {locale === 'ar' ? 'حل' : 'Solution'}
                        </Badge>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <PostLike
                        postId={post.id}
                        likeCount={post._count.likes}
                        isLoggedIn={!!session?.user}
                        locale={locale || 'ar'}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {topic.posts.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                {locale === 'ar' ? 'لا توجد ردود بعد. كن أول من يرد!' : 'No replies yet. Be the first!'}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reply form */}
        {session?.user && !topic.isLocked ? (
          <PostReply topicId={topic.id} locale={locale || 'ar'} />
        ) : !session?.user ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {locale === 'ar' ? 'سجل الدخول للرد' : 'Login to reply'}
              </p>
            </CardContent>
          </Card>
        ) : topic.isLocked ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {locale === 'ar' ? 'هذا الموضوع مقفل' : 'This topic is locked'}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
