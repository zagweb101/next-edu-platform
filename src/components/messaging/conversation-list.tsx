'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: any[];
  currentUserId: string;
  activeConversationId?: string;
  locale: string;
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
  locale,
}: ConversationListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const otherParticipants = c.participants.filter(p => p.userId !== currentUserId);
    return otherParticipants.some(p => p.user.name?.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
            className="ps-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {locale === 'ar' ? 'لا توجد محادثات' : 'No conversations'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(conv => {
              const otherParticipants = conv.participants.filter(p => p.userId !== currentUserId);
              const lastMessage = conv.messages[0];
              const isActive = conv.id === activeConversationId;

              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/dashboard/messages/${conv.id}`)}
                  className={cn(
                    'w-full p-3 flex items-start gap-3 text-start hover:bg-muted/30 transition-colors',
                    isActive && 'bg-primary/10',
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {otherParticipants[0]?.user.image && (
                      <AvatarImage src={otherParticipants[0].user.image} />
                    )}
                    <AvatarFallback>
                      {otherParticipants[0]?.user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {otherParticipants.map(p => p.user.name).join(', ')}
                      </span>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatRelative(lastMessage.createdAt, locale)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage
                          ? `${lastMessage.senderId === currentUserId ? (locale === 'ar' ? 'أنت: ' : 'You: ') : ''}${lastMessage.content}`
                          : (locale === 'ar' ? 'ابدأ المحادثة' : 'Start chatting')}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
