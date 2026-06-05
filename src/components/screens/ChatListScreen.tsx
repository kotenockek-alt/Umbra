'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChats } from '@/hooks/useChats';
import { Avatar, Modal, IconSettings, IconPlus, IconSearch } from '@/components/ui';
import type { Chat, Contact, Profile } from '@/types/db';

export function ChatListScreen({
  userId, onOpenChat, onOpenSettings, onOpenContact,
}: {
  userId: string;
  onOpenChat: (c: Chat) => void;
  onOpenSettings: () => void;
  onOpenContact: (p: Profile) => void;
}) {
  const { chats, query, setQuery, reload } = useChats(userId);
  const [tab, setTab] = useState<'stories' | 'contacts'>('stories');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [plusMenu, setPlusMenu] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts').select('*, profile:contact_id(*)').eq('owner_id', userId);
    setContacts((data as Contact[]) ?? []);
  };
  useEffect(() => { loadContacts(); }, [userId]);

  return (
    <div className="center-col" style={{ height: '100%' }}>
      {/* Верхняя панель: слева настройки, справа плюс */}
      <div className="row between" style={{ padding: '14px 14px 10px' }}>
        <button className="btn-icon" onClick={onOpenSettings} aria-label="Настройки">
          <IconSettings color="var(--ash)" />
        </button>
        <h2 className="title-display flicker" style={{ fontSize: 24, color: 'var(--ember)' }}>Umbra</h2>
        <button className="btn-icon btn-blood" onClick={() => setPlusMenu(true)} aria-label="Добавить">
          <IconPlus color="#fff" />
        </button>
      </div>

      {/* Поиск по названию чата */}
      <div style={{ padding: '0 14px 10px' }}>
        <div className="row gap-8 input" style={{ alignItems: 'center' }}>
          <IconSearch color="var(--ash)" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск чатов…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)', flex: 1 }}
          />
        </div>
      </div>

      {/* Вкладки */}
      <div className="row" style={{ margin: '0 14px 8px', background: 'var(--panel)', borderRadius: 12, padding: 4 }}>
        {(['stories', 'contacts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
              borderRadius: 9, fontFamily: 'var(--font-body)', fontSize: 14,
              background: tab === t ? 'var(--panel-3)' : 'transparent',
              color: tab === t ? 'var(--bone)' : 'var(--ash)',
              transition: 'all .2s',
            }}>
            {t === 'stories' ? 'Истории' : 'Контакты'}
          </button>
        ))}
      </div>

      {/* Список */}
      <div className="grow" style={{ overflowY: 'auto', padding: '0 8px 16px' }}>
        {tab === 'stories' && chats.map((c) => (
          <div key={c.id} className="row gap-12 rise" onClick={() => onOpenChat(c)}
            style={{ padding: '11px 10px', borderRadius: 12, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <Avatar src={c.avatar_url} name={c.title} size={50} />
            <div className="grow">
              <div className="title-display" style={{ fontSize: 17 }}>{c.title}</div>
              <div className="muted ellipsis" style={{ fontSize: 13 }}>групповой чат</div>
            </div>
          </div>
        ))}
        {tab === 'stories' && chats.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>Тишина. Здесь пока нет историй.</p>
        )}

        {tab === 'contacts' && contacts.map((ct) => (
          <div key={ct.id} className="row gap-12 rise" onClick={() => ct.profile && onOpenContact(ct.profile)}
            style={{ padding: '11px 10px', borderRadius: 12, cursor: 'pointer' }}>
            <Avatar src={ct.profile?.avatar_url} name={ct.profile?.name} size={50} />
            <div className="grow">
              <div className="title-display" style={{ fontSize: 17 }}>{ct.custom_name ?? ct.profile?.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>@{ct.profile?.username}</div>
            </div>
          </div>
        ))}
        {tab === 'contacts' && contacts.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>Никого. Добавьте контакт по username.</p>
        )}
      </div>

      {/* Меню плюса */}
      <Modal open={plusMenu} onClose={() => setPlusMenu(false)} title="Создать">
        <div className="center-col gap-8">
          <button className="btn" onClick={() => { setPlusMenu(false); setCreateOpen(true); }}>💬 Создать чат</button>
          <button className="btn" onClick={() => { setPlusMenu(false); setAddContactOpen(true); }}>👤 Добавить контакт</button>
        </div>
      </Modal>

      <CreateChatModal open={createOpen} onClose={() => setCreateOpen(false)} userId={userId}
        onCreated={() => { setCreateOpen(false); reload(); }} />
      <AddContactModal open={addContactOpen} onClose={() => setAddContactOpen(false)} userId={userId}
        onAdded={() => { setAddContactOpen(false); loadContacts(); }} />
    </div>
  );
}

/* ---------- Создание чата: название + аватар + фон ---------- */
function CreateChatModal({
  open, onClose, userId, onCreated,
}: { open: boolean; onClose: () => void; userId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    // аватар/фон можно загрузить через uploadFile — здесь создаём с названием,
    // изображения добавляются в меню чата (сменить аватар/фон).
    await supabase.from('chats').insert({ title: title.trim(), creator_id: userId, is_group: true });
    setBusy(false); setTitle(''); onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Новый чат">
      <div className="center-col gap-12">
        <input className="input" placeholder="Название чата" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p className="muted" style={{ fontSize: 12 }}>Аватар и фон можно задать в меню чата после создания.</p>
        <button className="btn btn-blood" disabled={busy} onClick={create}>Создать</button>
      </div>
    </Modal>
  );
}

/* ---------- Добавление контакта по username ---------- */
function AddContactModal({
  open, onClose, userId, onAdded,
}: { open: boolean; onClose: () => void; userId: string; onAdded: () => void }) {
  const [uname, setUname] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const add = async () => {
    setErr(null);
    const { data: prof } = await supabase
      .from('profiles').select('*').ilike('username', uname).maybeSingle();
    if (!prof) { setErr('Пользователь не найден'); return; }
    if (prof.id === userId) { setErr('Это вы'); return; }
    await supabase.from('contacts').insert({ owner_id: userId, contact_id: prof.id });
    setUname(''); onAdded();
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить контакт">
      <div className="center-col gap-12">
        <input className="input" placeholder="username" value={uname} onChange={(e) => setUname(e.target.value)} />
        {err && <p style={{ color: 'var(--ember)', fontSize: 13 }}>{err}</p>}
        <button className="btn btn-blood" onClick={add}>Найти и добавить</button>
      </div>
    </Modal>
  );
}
