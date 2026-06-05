'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Chat } from '@/types/db';

export function useChats(userId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    // чаты, где пользователь — участник
    const { data: members } = await supabase
      .from('chat_members').select('chat_id').eq('user_id', userId);
    const ids = (members ?? []).map((m) => m.chat_id);
    if (!ids.length) { setChats([]); return; }

    const { data } = await supabase
      .from('chats').select('*').in('id', ids)
      .order('created_at', { ascending: false });
    setChats((data as Chat[]) ?? []);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // поиск по названию
  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()));

  return { chats: filtered, query, setQuery, reload: load };
}
