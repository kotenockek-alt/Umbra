'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types/db';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        await loadProfile(data.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadProfile(uid);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refresh = useCallback(() => {
    if (userId) loadProfile(userId);
  }, [userId, loadProfile]);

  return { userId, profile, loading, refresh, hasProfile: !!profile };
}
