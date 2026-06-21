'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  locale: string;
}

export function ChatWindow({ conversationId, currentUserId, locale }: ChatWindowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherParticipants, setOtherParticipants] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    async function loadMessages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}/messages?limit=50`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setMessages(data.items || []);
        // Get conversation details (participants)
        const convRes = await fetch(`/api/messages/conversations/${conversationId}`);
        if (convRes.ok) {
          const conv = await convRes.json();
          setOtherParticipants(
            conv.participants?.filter((p: any) => p.userId !== currentUserId) || []
          );
        }
      } catch (e) {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [conversationId, currentUserId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const lastMsg = messages[messages.length - 1];
        const url = `/api/messages/conversations/${conversationId}/messages?limit=50`;
        const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
        if (!res.ok) return;
        const data = await res.json();
        const newMsgs = data.items || [];
        if (newMsgs.length > messages.length) {
          setMessages(newMsgs);
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const title = otherParticipants.map(p => p.user?.name).join(', ') || (locale === 'ar' ? 'محادثة' : 'Chat');

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={() => router.push('/dashboard/messages')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {otherParticipants[0]?.user?.image && (
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherParticipants[0].user.image} />
            <AvatarFallback>{otherParticipants[0]?.user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        )}
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">
            {otherParticipants.length + 1} {locale === 'ar' ? 'مشاركين' : 'participants'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">
                {locale === 'ar' ? 'لا توجد رسائل بعد. ابدأ المحادثة!' : 'No messages yet. Start the conversation!'}
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn('flex items-end gap-2', isMine && 'flex-row-reverse')}
                >
                  {!isMine && (
                    <Avatar className="h-7 w-7 shrink-0">
                      {msg.sender?.image && <AvatarImage src={msg.sender.image} />}
                      <AvatarFallback className="text-xs">
                        {msg.sender?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-[70%]', isMine ? 'items-end' : 'items-start')}>
                    {!isMine && (
                      <p className="text-xs text-muted-foreground mb-1 ms-1">{msg.sender?.name}</p>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3 text-sm',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <p className={cn('text-xs text-muted-foreground mt-1', isMine ? 'text-end' : 'text-start')}>
                      {formatRelative(msg.createdAt, locale)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Send form */}
      <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
          maxLength={5000}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </>
  );
}
