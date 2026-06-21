/**
 * Create new forum topic page
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewTopicForm } from '@/components/forum/new-topic-form';

export default async function NewTopicPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/forum/new`);
  }

  const categories = await db.forumCategory.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'موضوع جديد' : 'New Topic'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'اطرح سؤالك أو شارك فكرتك مع المجتمع'
            : 'Ask your question or share your idea with the community'}
        </p>
      </div>

      <NewTopicForm categories={categories} locale={locale || 'ar'} />
    </div>
  );
}
