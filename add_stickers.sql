-- Таблица стикеров пользователя (картинки, которые можно слать в чаты)
create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists stickers_owner_idx on public.stickers(owner_id);

alter table public.stickers enable row level security;

create policy stickers_read on public.stickers for select using (true);
create policy stickers_all on public.stickers for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant all on public.stickers to anon, authenticated;
