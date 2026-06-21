'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Play, Video, Users, MessageSquare } from 'lucide-react';

interface LiveViewerProps {
  live: any;
  isTeacher: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  locale: string;
}

export function LiveViewer({ live, isTeacher, isAdmin, isLoggedIn, locale }: LiveViewerProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>(live.chatMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll for new chat messages every 3 seconds when live
  useEffect(() => {
    if (live.status !== 'LIVE') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live/${live.id}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.chatMessages && data.chatMessages.length > messages.length) {
          setMessages(data.chatMessages);
        }
      } catch (e) {
        // Silent fail
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [live.id, live.status, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !isLoggedIn) return;

    setSending(true);
    try {
      const res = await fetch(`/api/live/${live.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (e: any) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  async function controlSession(action: 'start' | 'end' | 'cancel') {
    setStarting(true);
    try {
      const res = await fetch(`/api/live/${live.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({
        title: locale === 'ar' ? 'تم' : 'Done',
        description: action === 'start'
          ? (locale === 'ar' ? 'بدأت الجلسة المباشرة' : 'Session is now live')
          : (locale === 'ar' ? 'انتهت الجلسة' : 'Session ended'),
      });
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  }

  const isLive = live.status === 'LIVE';
  const canControl = isTeacher || isAdmin;

  return (
    <div className="space-y-4">
      {/* Video area */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-black flex items-center justify-center relative">
          {isLive ? (
            <LiveEmbed live={live} />
          ) : (
            <div className="text-center text-white">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {live.status === 'SCHEDULED'
                  ? (locale === 'ar' ? 'الجلسة لم تبدأ بعد' : 'Session has not started')
                  : live.status === 'ENDED'
                  ? (locale === 'ar' ? 'انتهت الجلسة' : 'Session ended')
                  : (locale === 'ar' ? 'ألغيت الجلسة' : 'Session canceled')}
              </p>
              {live.status === 'SCHEDULED' && (
                <p className="text-sm opacity-70">
                  {new Date(live.scheduledStart).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              )}
            </div>
          )}

          {/* Teacher controls */}
          {canControl && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
              {live.status === 'SCHEDULED' && (
                <Button
                  onClick={() => controlSession('start')}
                  disabled={starting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Play className="h-4 w-4 me-2" />}
                  {locale === 'ar' ? 'بدء البث' : 'Go Live'}
                </Button>
              )}
              {isLive && (
                <Button
                  onClick={() => controlSession('end')}
                  disabled={starting}
                  variant="destructive"
                >
                  {locale === 'ar' ? 'إنهاء البث' : 'End Stream'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Chat */}
      <Card className="h-96 flex flex-col">
        <div className="p-3 border-b flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium text-sm">
            {locale === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}
          </span>
          <span className="text-xs text-muted-foreground ms-auto">
            {messages.length} {locale === 'ar' ? 'رسالة' : 'messages'}
          </span>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {locale === 'ar' ? 'لا توجد رسائل بعد. كن أول من يكتب!' : 'No messages yet. Be the first!'}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={msg.user?.image || ''} />
                    <AvatarFallback className="text-xs">
                      {msg.user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{msg.user?.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {isLoggedIn && isLive && (
          <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={locale === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
              maxLength={500}
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
        {!isLoggedIn && (
          <div className="p-3 border-t text-center text-sm text-muted-foreground">
            {locale === 'ar' ? 'سجل الدخول للدردشة' : 'Login to chat'}
          </div>
        )}
      </Card>
    </div>
  );
}

function LiveEmbed({ live }: { live: any }) {
  // Different embeds based on provider
  if (live.provider === 'YOUTUBE' && live.youtubeLiveUrl) {
    return (
      <iframe
        src={live.youtubeLiveUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (live.provider === 'ZOOM' && live.zoomJoinUrl) {
    return (
      <div className="text-center text-white p-8">
        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="mb-4">
          Zoom meeting in progress
        </p>
        <a
          href={live.zoomJoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Join Zoom Meeting
        </a>
        {live.zoomPassword && (
          <p className="mt-3 text-sm opacity-70">Password: {live.zoomPassword}</p>
        )}
      </div>
    );
  }

  // WebRTC fallback — in a real implementation, this would connect to a WebRTC service
  return (
    <div className="text-center text-white p-8">
      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p className="mb-2">
        WebRTC Live Stream
      </p>
      <p className="text-sm opacity-70 mb-4">Room: {live.webrtcRoomId}</p>
      <p className="text-xs opacity-50">
        WebRTC player would connect here. Use Zoom or YouTube for production.
      </p>
    </div>
  );
}
