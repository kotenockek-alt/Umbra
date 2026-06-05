-- ============================================================================
--  UMBRA MESSENGER — схема базы данных (Supabase / Postgres)
--  Выполнить целиком в Supabase → SQL Editor.
-- ============================================================================

-- ---------- РАСШИРЕНИЯ -------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ============================================================================
--  PROFILES — профиль пользователя (1:1 с auth.users)
-- ============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Безымянный',
  -- username: только русские/английские буквы и цифры. Уникален.
  username    text not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),

  constraint username_format check (username ~ '^[A-Za-zА-Яа-яЁё0-9]+$'),
  constraint username_length check (char_length(username) between 3 and 32)
);

-- Уникальность без учёта регистра — нельзя создать уже существующий username.
create unique index profiles_username_unique
  on public.profiles (lower(username));

-- ============================================================================
--  USER_ROLES — пользовательские роли (название + аватар).
--  Используются при отправке сообщений в ЛЮБЫХ чатах.
-- ============================================================================
create table public.user_roles (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);
create index user_roles_owner_idx on public.user_roles(owner_id);

-- ============================================================================
--  CONTACTS — контакты/друзья. custom_name — локальное переименование.
-- ============================================================================
create table public.contacts (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  contact_id   uuid not null references public.profiles(id) on delete cascade,
  custom_name  text,
  created_at   timestamptz not null default now(),
  unique (owner_id, contact_id)
);
create index contacts_owner_idx on public.contacts(owner_id);

-- ============================================================================
--  CHATS — чат (групповой или личный)
-- ============================================================================
create table public.chats (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  avatar_url      text,
  background_url  text,
  is_group        boolean not null default true,
  creator_id      uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now()
);
create index chats_creator_idx on public.chats(creator_id);

-- Системная роль участника в чате
create type member_role as enum ('creator', 'admin', 'member');

-- ============================================================================
--  CHAT_MEMBERS — участники чата
-- ============================================================================
create table public.chat_members (
  id               uuid primary key default uuid_generate_v4(),
  chat_id          uuid not null references public.chats(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  system_role      member_role not null default 'member',
  -- выбранная пользователем роль для этого чата (из user_roles)
  selected_role_id uuid references public.user_roles(id) on delete set null,
  joined_at        timestamptz not null default now(),
  unique (chat_id, user_id)
);
create index chat_members_chat_idx on public.chat_members(chat_id);
create index chat_members_user_idx on public.chat_members(user_id);

-- ============================================================================
--  MESSAGES — сообщения
--  Имя пользователя НЕ хранится в выдаче — показывается роль (role_id).
-- ============================================================================
create type message_kind as enum ('text', 'image', 'video');

create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  role_id     uuid references public.user_roles(id) on delete set null,
  kind        message_kind not null default 'text',
  body        text,                 -- текст или подпись
  media_url   text,                 -- для image/video
  created_at  timestamptz not null default now()
);
create index messages_chat_idx on public.messages(chat_id, created_at);

-- ============================================================================
--  EVENTS — события чата (серый текст по центру)
-- ============================================================================
create table public.events (
  id          uuid primary key default uuid_generate_v4(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);
create index events_chat_idx on public.events(chat_id, created_at);

-- ============================================================================
--  ХЕЛПЕР: проверка членства/прав (SECURITY DEFINER, обходит рекурсию RLS)
-- ============================================================================
create or replace function public.is_member(p_chat uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.chat_members
    where chat_id = p_chat and user_id = auth.uid()
  );
$$;

create or replace function public.my_role(p_chat uuid)
returns member_role language sql security definer stable as $$
  select system_role from public.chat_members
  where chat_id = p_chat and user_id = auth.uid();
$$;

-- ============================================================================
--  ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.contacts      enable row level security;
alter table public.chats         enable row level security;
alter table public.chat_members  enable row level security;
alter table public.messages      enable row level security;
alter table public.events        enable row level security;

-- ---- PROFILES: читать всем (для поиска по username), править только свой ----
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- ---- USER_ROLES: владелец управляет; читать может любой (для отображения) ---
create policy roles_read on public.user_roles for select using (true);
create policy roles_all  on public.user_roles for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---- CONTACTS: только свои ---------------------------------------------------
create policy contacts_all on public.contacts for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---- CHATS -------------------------------------------------------------------
-- видеть чат может участник
create policy chats_read on public.chats for select
  using (public.is_member(id));
-- создать чат может любой авторизованный (он становится creator)
create policy chats_insert on public.chats for insert
  with check (creator_id = auth.uid());
-- название/аватар: создатель и админ; фон: только создатель
-- (проверка конкретных полей делается в приложении; здесь — общий доступ
--  создателю и админу, фон дополнительно ограничен триггером ниже)
create policy chats_update on public.chats for update
  using (public.my_role(id) in ('creator','admin'));

-- Триггер: менять background_url может только создатель
create or replace function public.guard_chat_background()
returns trigger language plpgsql security definer as $$
begin
  if new.background_url is distinct from old.background_url
     and old.creator_id <> auth.uid() then
    raise exception 'Фон чата может менять только создатель';
  end if;
  return new;
end; $$;
create trigger trg_guard_background
  before update on public.chats
  for each row execute function public.guard_chat_background();

-- ---- CHAT_MEMBERS ------------------------------------------------------------
create policy members_read on public.chat_members for select
  using (public.is_member(chat_id));
-- добавить себя в чат (вступление) или быть добавленным создателем/админом
create policy members_insert on public.chat_members for insert
  with check (user_id = auth.uid() or public.my_role(chat_id) in ('creator','admin'));
-- участник может менять свою выбранную роль; админ/создатель — управлять
create policy members_update on public.chat_members for update
  using (user_id = auth.uid() or public.my_role(chat_id) in ('creator','admin'));
-- выйти из чата
create policy members_delete on public.chat_members for delete
  using (user_id = auth.uid() or public.my_role(chat_id) in ('creator','admin'));

-- ---- MESSAGES ----------------------------------------------------------------
create policy messages_read on public.messages for select
  using (public.is_member(chat_id));
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid() and public.is_member(chat_id));
create policy messages_delete on public.messages for delete
  using (sender_id = auth.uid() or public.my_role(chat_id) in ('creator','admin'));

-- ---- EVENTS: создавать могут создатель/админ; читать — участники ------------
create policy events_read on public.events for select
  using (public.is_member(chat_id));
create policy events_insert on public.events for insert
  with check (public.my_role(chat_id) in ('creator','admin'));

-- ============================================================================
--  ТРИГГЕР: при создании чата автоматически добавить создателя участником
-- ============================================================================
create or replace function public.add_creator_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.chat_members (chat_id, user_id, system_role)
  values (new.id, new.creator_id, 'creator');
  return new;
end; $$;
create trigger trg_add_creator
  after insert on public.chats
  for each row execute function public.add_creator_as_member();

-- ============================================================================
--  STORAGE: бакеты (создать вручную в UI или выполнить ниже)
--  avatars, backgrounds, media — публичные на чтение.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('backgrounds','backgrounds',true), ('media','media',true)
on conflict (id) do nothing;

create policy "storage public read"  on storage.objects for select using (true);
create policy "storage auth write"   on storage.objects for insert
  to authenticated with check (true);
