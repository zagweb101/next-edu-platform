/**
 * Messages page — list of conversations + selected conversation
 */
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ConversationList } from '@/components/messaging/conversation-list';
import { ChatWindow } from '@/components/messaging/chat-window';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale?: string; conversationId?: string }>;
}) {
  const { locale, conversationId } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/messages`);
  }

  // Get user's conversations
  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  // Compute unread counts
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const participant = conv.participants.find(p => p.userId === session.user.id);
      const lastReadAt = participant?.lastReadAt;
      const unreadCount = await db.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: session.user.id },
          isDeleted: false,
          ...(lastReadAt && { createdAt: { gt: lastReadAt } }),
        },
      });
      return { ...conv, unreadCount };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-7 w-7" />
          {locale === 'ar' ? 'الرسائل' : 'Messages'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? `${conversations.length} محادثة`
            : `${conversations.length} conversations`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Conversation list */}
        <div className="md:col-span-1 border rounded-lg overflow-hidden flex flex-col">
          <ConversationList
            conversations={conversationsWithUnread as any}
            currentUserId={session.user.id}
            activeConversationId={conversationId}
            locale={locale || 'ar'}
          />
        </div>

        {/* Chat window */}
        <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
          {conversationId ? (
            <ChatWindow
              conversationId={conversationId}
              currentUserId={session.user.id}
              locale={locale || 'ar'}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>
                  {locale === 'ar'
                    ? 'اختر محادثة لعرضها'
                    : 'Select a conversation to view'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
