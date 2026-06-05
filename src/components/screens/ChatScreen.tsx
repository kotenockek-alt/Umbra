'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMessages } from '@/hooks/useMessages';
import { useRoles } from '@/hooks/useRoles';
import { uploadFile, mediaKind } from '@/lib/storage';
import { MessageBubble, EventLine, ChatHeader, Composer, ChatMenu } from '@/components/chat';
import { Modal } from '@/components/ui';
import type { Chat, MemberRole, UserRole } from '@/types/db';

export function ChatScreen({
  chat, userId, onBack,
}: { chat: Chat; userId: string; onBack: () => void }) {
  const { feed, reload } = useMessages(chat.id);
  const { roles } = useRoles(userId);
  const [myRole, setMyRole] = useState<MemberRole>('member');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatState, setChatState] = useState<Chat>(chat);
  const [prompt, setPrompt] = useState<{ kind: string; value: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // системная роль текущего пользователя в чате
  useEffect(() => {
    supabase.from('chat_members').select('system_role, selected_role_id')
      .eq('chat_id', chat.id).eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (data) setMyRole(data.system_role as MemberRole); });
  }, [chat.id, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [feed]);

  const sendText = async (text: string) => {
    await supabase.from('messages').insert({
      chat_id: chat.id, sender_id: userId, role_id: selectedRole?.id ?? null,
      kind: 'text', body: text,
    });
  };
  const sendMedia = async (file: File) => {
    const url = await uploadFile('media', file);
    await supabase.from('messages').insert({
      chat_id: chat.id, sender_id: userId, role_id: selectedRole?.id ?? null,
      kind: mediaKind(file), media_url: url,
    });
  };

  const leave = async () => {
    await supabase.from('chat_members').delete().eq('chat_id', chat.id).eq('user_id', userId);
    onBack();
  };

  // действия меню → событие + изменение
  const addEvent = async (text: string) => {
    await supabase.from('events').insert({ chat_id: chat.id, text });
  };
  const rename = async (title: string) => {
    await supabase.from('chats').update({ title }).eq('id', chat.id);
    setChatState((s) => ({ ...s, title }));
    addEvent(`Чат переименован: «${title}»`);
  };

  const menuActions: Record<string, () => void> = {
    background: () => setPrompt({ kind: 'background', value: '' }),
    title: () => setPrompt({ kind: 'title', value: chatState.title }),
    avatar: () => setPrompt({ kind: 'avatar', value: '' }),
    addRole: () => setPrompt({ kind: 'addRole', value: '' }),
    editRole: () => setPrompt({ kind: 'addRole', value: '' }),
    selectRole: () => setPrompt({ kind: 'selectRole', value: '' }),
    members: () => setPrompt({ kind: 'members', value: '' }),
    memberRoles: () => setPrompt({ kind: 'members', value: '' }),
    addEvent: () => setPrompt({ kind: 'event', value: '' }),
    leave,
  };

  return (
    <div className="center-col" style={{
      height: '100%',
      background: chatState.background_url
        ? `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.75)), center/cover url(${chatState.background_url})`
        : 'radial-gradient(120% 80% at 50% 0%, #16161a, var(--abyss))',
    }}>
      <ChatHeader chat={chatState} onOpenMenu={() => setMenuOpen(true)} onLeave={leave} />

      <div className="grow" style={{ overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.map((it) =>
          it.type === 'message'
            ? <MessageBubble key={it.id} item={it} />
            : <EventLine key={it.id} item={it} />,
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        roles={roles}
        selectedRole={selectedRole}
        onPickRole={setSelectedRole}
        onSendText={sendText}
        onSendMedia={sendMedia}
      />

      <ChatMenu open={menuOpen} onClose={() => setMenuOpen(false)} role={myRole} actions={menuActions} />

      {/* Универсальный prompt для текстовых действий меню */}
      <Modal open={!!prompt} onClose={() => setPrompt(null)} title={promptTitle(prompt?.kind)}>
        {prompt && <PromptBody
          prompt={prompt}
          onSubmit={async (val, file) => {
            if (prompt.kind === 'title') await rename(val);
            if (prompt.kind === 'event') await addEvent(val);
            if (prompt.kind === 'avatar' && file) {
              const url = await uploadFile('avatars', file);
              await supabase.from('chats').update({ avatar_url: url }).eq('id', chat.id);
              setChatState((s) => ({ ...s, avatar_url: url }));
            }
            if (prompt.kind === 'background' && file) {
              const url = await uploadFile('backgrounds', file);
              await supabase.from('chats').update({ background_url: url }).eq('id', chat.id);
              setChatState((s) => ({ ...s, background_url: url }));
            }
            if (prompt.kind === 'addRole' && val) {
              const url = file ? await uploadFile('avatars', file) : null;
              await supabase.from('user_roles').insert({ owner_id: userId, name: val, avatar_url: url });
              await addEvent(`Создана роль ${val}`);
            }
            setPrompt(null);
            reload();
          }}
        />}
      </Modal>
    </div>
  );
}

function promptTitle(kind?: string) {
  return ({
    title: 'Новое название', avatar: 'Аватар чата', background: 'Фон чата',
    addRole: 'Новая роль', event: 'Новое событие', selectRole: 'Выбрать роль', members: 'Участники',
  } as Record<string, string>)[kind ?? ''] ?? '';
}

function PromptBody({
  prompt, onSubmit,
}: { prompt: { kind: string; value: string }; onSubmit: (v: string, f?: File) => void }) {
  const [val, setVal] = useState(prompt.value);
  const [file, setFile] = useState<File | undefined>();
  const needsText = ['title', 'event', 'addRole'].includes(prompt.kind);
  const needsFile = ['avatar', 'background', 'addRole'].includes(prompt.kind);
  const infoOnly = ['members', 'selectRole'].includes(prompt.kind);

  if (infoOnly) {
    return <p className="muted">Раздел в разработке каркаса — подключите запрос участников/ролей здесь.</p>;
  }

  return (
    <div className="center-col gap-12">
      {needsText && <input className="input" value={val} placeholder="Введите текст…"
        onChange={(e) => setVal(e.target.value)} />}
      {needsFile && <input type="file" accept="image/*" className="input"
        onChange={(e) => setFile(e.target.files?.[0])} />}
      <button className="btn btn-blood" onClick={() => onSubmit(val, file)}>Сохранить</button>
    </div>
  );
}
