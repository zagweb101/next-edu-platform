/**
 * Forum home page — lists categories + recent topics
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, MessageSquare, Eye, ThumbsUp, Pin } from 'lucide-react';
import { formatRelative } from '@/lib/format';

export default async function ForumPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  const [categories, recentTopics] = await Promise.all([
    db.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { topics: true } },
      },
    }),
    db.forumTopic.findMany({
      take: 20,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      include: {
        category: { select: { id: true, name: true, color: true } },
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { posts: true, likes: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-muted/30">
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {locale === 'ar' ? 'منتدى النقاش' : 'Discussion Forum'}
              </h1>
              <p className="text-muted-foreground">
                {locale === 'ar'
                  ? 'اطرح أسئلتك، شارك خبراتك، وتفاعل مع المجتمع'
                  : 'Ask questions, share expertise, engage with the community'}
              </p>
            </div>
            {session?.user && (
              <Link href="/forum/new">
                <Button size="lg">
                  <Plus className="h-4 w-4 me-2" />
                  {locale === 'ar' ? 'موضوع جديد' : 'New Topic'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'الأقسام' : 'Categories'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <Link href="/forum" className="block p-3 hover:bg-muted/30 font-medium text-sm">
                    {locale === 'ar' ? 'كل المواضيع' : 'All Topics'}
                  </Link>
                  {categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/forum?category=${cat.id}`}
                      className="block p-3 hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <Badge variant="secondary">{cat._count.topics}</Badge>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{cat.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topics list */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'أحدث المواضيع' : 'Recent Topics'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentTopics.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">
                      {locale === 'ar' ? 'لا توجد مواضيع بعد' : 'No topics yet'}
                    </p>
                    {session?.user && (
                      <Link href="/forum/new">
                        <Button>
                          <Plus className="h-4 w-4 me-2" />
                          {locale === 'ar' ? 'ابدأ أول نقاش' : 'Start the first discussion'}
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentTopics.map(topic => (
                      <Link
                        key={topic.id}
                        href={`/forum/${topic.slug}`}
                        className="block p-4 hover:bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={topic.author.image || ''} />
                            <AvatarFallback>{topic.author.name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {topic.isPinned && <Pin className="h-3 w-3 text-primary" />}
                              <h3 className="font-medium text-sm truncate">{topic.title}</h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{topic.author.name}</span>
                              <span>•</span>
                              <span>{formatRelative(topic.updatedAt, locale)}</span>
                              {topic.category && (
                                <>
                                  <span>•</span>
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={topic.category.color ? { color: topic.category.color, borderColor: topic.category.color } : undefined}
                                  >
                                    {topic.category.name}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {topic._count.posts}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {topic.viewsCount}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
