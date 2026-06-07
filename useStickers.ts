'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Sticker } from '@/types/db';

export function useStickers(ownerId: string | null) {
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const load = useCallback(async () => {
    if (!ownerId) return;
    const { data } = await supabase
      .from('stickers').select('*')
      .eq('owner_id', ownerId).order('created_at', { ascending: false });
    setStickers((data as Sticker[]) ?? []);
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const addSticker = async (url: string) => {
    if (!ownerId) return;
    await supabase.from('stickers').insert({ owner_id: ownerId, url });
    await load();
  };
  const deleteSticker = async (id: string) => {
    await supabase.from('stickers').delete().eq('id', id);
    await load();
  };

  return { stickers, addSticker, deleteSticker, reload: load };
}
