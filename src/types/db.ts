// Типы сущностей, соответствующие схеме БД (supabase/schema.sql)

export type MemberRole = 'creator' | 'admin' | 'member';
export type MessageKind = 'text' | 'image' | 'video';

export interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  owner_id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  contact_id: string;
  custom_name: string | null;
  created_at: string;
  // join
  profile?: Profile;
}

export interface Chat {
  id: string;
  title: string;
  avatar_url: string | null;
  background_url: string | null;
  is_group: boolean;
  creator_id: string;
  created_at: string;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  system_role: MemberRole;
  selected_role_id: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  role_id: string | null;
  kind: MessageKind;
  body: string | null;
  media_url: string | null;
  created_at: string;
  // join: роль, под которой отправлено
  role?: UserRole | null;
}

export interface ChatEvent {
  id: string;
  chat_id: string;
  text: string;
  created_at: string;
}

// Унифицированный элемент ленты чата: сообщение или событие
export type FeedItem =
  | ({ type: 'message' } & Message)
  | ({ type: 'event' } & ChatEvent);
