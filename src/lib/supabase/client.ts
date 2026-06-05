'use client';

import { createBrowserClient } from '@supabase/ssr';

// Единый клиент Supabase для клиентских компонентов.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
