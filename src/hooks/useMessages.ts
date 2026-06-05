'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Message, ChatEvent, UserRole, FeedItem } from '@/types/db';

export function useMessages(chatId: string | null) {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const load = useCallback(async () => {
    if (!chatId) return;

    const [{ data: msgs }, { data: evts }] = await Promise.all([
      supabase.from('messages')
        .select('*, role:role_id(*)')
        .eq('chat_id', chatId).order('created_at'),
      supabase.from('events')
        .select('*').eq('chat_id', chatId).order('created_at'),
    ]);

    const items: FeedItem[] = [
      ...((msgs ?? []) as (Message & { role: UserRole | null })[])
        .map((m) => ({ type: 'message' as const, ...m })),
      ...((evts ?? []) as ChatEvent[])
        .map((e) => ({ type: 'event' as const, ...e })),
    ].sort((a, b) => a.created_at.localeCompare(b.created_at));

    setFeed(items);
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: подписка на новые сообщения и события
  useEffect(() => {
    if (!chatId) return;
    const ch = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => load())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events', filter: `chat_id=eq.${chatId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chatId, load]);

  return { feed, reload: load };
}
