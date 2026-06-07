'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChats } from '@/hooks/useChats';
import { Avatar, Modal, IconSettings, IconPlus, IconSearch, IconChat, IconUserPlus } from '@/components/ui';
import type { Chat, Contact, Profile } from '@/types/db';

// Форматирует время последнего сообщения: «14:30» сегодня, иначе дата
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

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
            {c.last_message_at && (
              <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>
                {formatTime(c.last_message_at)}
              </span>
            )}
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
          <button className="btn row gap-12" style={{ justifyContent: 'flex-start' }}
            onClick={() => { setPlusMenu(false); setCreateOpen(true); }}>
            <IconChat color="var(--ember)" /> Создать чат
          </button>
          <button className="btn row gap-12" style={{ justifyContent: 'flex-start' }}
            onClick={() => { setPlusMenu(false); setAddContactOpen(true); }}>
            <IconUserPlus color="var(--ember)" /> Добавить контакт
          </button>
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
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    // создаём чат и сразу получаем его обратно (.select), чтобы убедиться, что сохранился
    const { data, error } = await supabase
      .from('chats')
      .insert({ title: title.trim(), creator_id: userId, is_group: true })
      .select()
      .single();
    if (error || !data) {
      setBusy(false);
      setErr('Не удалось создать чат: ' + (error?.message ?? 'неизвестная ошибка'));
      return;
    }
    // ВАЖНО: добавляем создателя в участники, иначе чат не появится в списке
    const { error: memErr } = await supabase
      .from('chat_members')
      .insert({ chat_id: data.id, user_id: userId, system_role: 'creator' });
    setBusy(false);
    if (memErr && !memErr.message.includes('duplicate')) {
      setErr('Чат создан, но не удалось вступить: ' + memErr.message);
      return;
    }
    setTitle('');
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Новый чат">
      <div className="center-col gap-12">
        <input className="input" placeholder="Название чата" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p className="muted" style={{ fontSize: 12 }}>Аватар и фон можно задать в меню чата после создания.</p>
        {err && <p style={{ color: 'var(--ember)', fontSize: 13 }}>{err}</p>}
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
    const clean = uname.trim().replace(/^@/, '');
    if (!clean) { setErr('Введите username'); return; }
    const { data: prof } = await supabase
      .from('profiles').select('*').ilike('username', clean).maybeSingle();
    if (!prof) { setErr('Пользователь не найден'); return; }
    if (prof.id === userId) { setErr('Это вы'); return; }
    // не добавляем дубликат
    const { data: existing } = await supabase
      .from('contacts').select('id').eq('owner_id', userId).eq('contact_id', prof.id).maybeSingle();
    if (existing) { setErr('Контакт уже добавлен'); return; }
    const { error } = await supabase.from('contacts').insert({ owner_id: userId, contact_id: prof.id });
    if (error) { setErr('Ошибка: ' + error.message); return; }
    setUname(''); onAdded(); onClose();
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
