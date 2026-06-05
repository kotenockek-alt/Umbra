'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { UserRole } from '@/types/db';

export function useRoles(ownerId: string | null) {
  const [roles, setRoles] = useState<UserRole[]>([]);

  const load = useCallback(async () => {
    if (!ownerId) return;
    const { data } = await supabase
      .from('user_roles').select('*')
      .eq('owner_id', ownerId).order('created_at');
    setRoles((data as UserRole[]) ?? []);
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const createRole = async (name: string, avatar_url: string | null) => {
    if (!ownerId) return;
    await supabase.from('user_roles').insert({ owner_id: ownerId, name, avatar_url });
    await load();
  };
  const updateRole = async (id: string, patch: Partial<UserRole>) => {
    await supabase.from('user_roles').update(patch).eq('id', id);
    await load();
  };
  const deleteRole = async (id: string) => {
    await supabase.from('user_roles').delete().eq('id', id);
    await load();
  };

  return { roles, createRole, updateRole, deleteRole, reload: load };
}
