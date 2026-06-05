'use client';

import React, { useRef, useState } from 'react';
import { Avatar, Modal, IconSend, IconPlus, IconExit } from '@/components/ui';
import type { FeedItem, UserRole, MemberRole, Chat } from '@/types/db';

/* ========================================================================
   Форматирование текста сообщения:
   **жирный**  → жирный шрифт
   *курсив*    → курсив
   переносы строк → абзацы
   ======================================================================== */
function renderFormatted(text: string): React.ReactNode {
  // разбиваем на строки, чтобы сохранить абзацы/переносы
  const lines = text.split('\n');
  return lines.map((line, li) => (
    <React.Fragment key={li}>
      {parseInline(line)}
      {li < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

// обработка **жирный** и *курсив* внутри одной строки
function parseInline(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // регулярка ловит **...** или *...*
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) nodes.push(line.slice(last, m.index));
    if (m[2] !== undefined) {
      // **жирный**
      nodes.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      // *курсив*
      nodes.push(<em key={key++}>{m[3]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes;
}

/* ========================================================================
   Пузырь сообщения — белый, чёрный текст, закруглённые углы (как Telegram).
   Под сообщением: аватарка роли + название роли. Имя пользователя НЕ видно.
   ======================================================================== */
export function MessageBubble({ item }: { item: Extract<FeedItem, { type: 'message' }> }) {
  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '78%' }}>
      <div style={{
        background: '#f4f1ec', color: '#0a0a0a',
        borderRadius: 18, borderBottomLeftRadius: 6,
        padding: '9px 13px', fontSize: 15, lineHeight: 1.4,
        boxShadow: '0 4px 14px rgba(0,0,0,.5)', wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {item.kind === 'image' && item.media_url && (
          <img src={item.media_url} alt="" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: item.body ? 6 : 0 }} />
        )}
        {item.kind === 'video' && item.media_url && (
          <video src={item.media_url} controls style={{ maxWidth: '100%', borderRadius: 12, marginBottom: item.body ? 6 : 0 }} />
        )}
        {item.body && renderFormatted(item.body)}
      </div>
      {/* роль под сообщением */}
      <div className="row gap-8" style={{ marginTop: 5, marginLeft: 4 }}>
        <Avatar src={item.role?.avatar_url} name={item.role?.name ?? '?'} size={20} />
        <span className="muted" style={{ fontSize: 12.5 }}>
          {item.role?.name ?? 'Без роли'}
        </span>
      </div>
    </div>
  );
}

/* ========================================================================
   Событие — серый текст строго по центру, без пузыря и аватарки.
   ======================================================================== */
export function EventLine({ item }: { item: Extract<FeedItem, { type: 'event' }> }) {
  return (
    <div className="rise" style={{ textAlign: 'center', padding: '6px 0' }}>
      <span className="muted" style={{ fontSize: 13, fontStyle: 'italic', letterSpacing: '.3px' }}>
        {item.text}
      </span>
    </div>
  );
}

/* ========================================================================
   Шапка чата — ТОЛЬКО: аватар слева, название, кнопка выхода.
   Тап по шапке (кроме кнопки выхода) открывает меню.
   ======================================================================== */
export function ChatHeader({
  chat, onOpenMenu, onLeave,
}: { chat: Chat; onOpenMenu: () => void; onLeave: () => void }) {
  return (
    <div
      className="row between"
      style={{
        padding: '12px 14px', background: 'var(--panel)',
        borderBottom: '1px solid var(--panel-3)', cursor: 'pointer',
      }}
      onClick={onOpenMenu}
    >
      <div className="row gap-12 grow">
        <Avatar src={chat.avatar_url} name={chat.title} size={40} />
        <span className="title-display ellipsis" style={{ fontSize: 19 }}>{chat.title}</span>
      </div>
      <button
        className="btn-icon"
        onClick={(e) => { e.stopPropagation(); onLeave(); }}
        aria-label="Выйти из чата"
      >
        <IconExit size={20} color="var(--ash)" />
      </button>
    </div>
  );
}

/* ========================================================================
   Композер — поле ввода, отправка, плюс (роль / фото / видео).
   ======================================================================== */
export function Composer({
  roles, selectedRole, onPickRole, onSendText, onSendMedia,
}: {
  roles: UserRole[];
  selectedRole: UserRole | null;
  onPickRole: (r: UserRole) => void;
  onSendText: (text: string) => void;
  onSendMedia: (file: File) => void;
}) {
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [rolePick, setRolePick] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSendText(t);
    setText('');
  };

  return (
    <div style={{ padding: '10px 12px', background: 'var(--panel)', borderTop: '1px solid var(--panel-3)' }}>
      {selectedRole && (
        <div className="row gap-8" style={{ marginBottom: 6, paddingLeft: 4 }}>
          <Avatar src={selectedRole.avatar_url} name={selectedRole.name} size={18} />
          <span className="muted" style={{ fontSize: 12 }}>от имени: {selectedRole.name}</span>
        </div>
      )}
      <div className="row gap-8" style={{ alignItems: 'flex-end' }}>
        <textarea
          className="input grow"
          placeholder="Сообщение…   (Shift+Enter — новая строка)"
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter — отправить; Shift+Enter — перенос строки (абзац)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          style={{ resize: 'none', maxHeight: 120, fontFamily: 'var(--font-body)', lineHeight: 1.4 }}
        />
        <button className="btn-icon" onClick={() => setMenu(true)} aria-label="Меню">
          <IconPlus size={22} color="var(--ash)" />
        </button>
        <button className="btn-icon btn-blood" onClick={send} aria-label="Отправить">
          <IconSend size={18} color="#fff" />
        </button>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*,video/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSendMedia(f); e.target.value = ''; }}
      />

      <Modal open={menu} onClose={() => setMenu(false)} title="Действие">
        <div className="center-col gap-8">
          <button className="btn" onClick={() => { setMenu(false); setRolePick(true); }}>
            🎭 Выбрать роль для отправки
          </button>
          <button className="btn" onClick={() => { setMenu(false); fileRef.current?.click(); }}>
            🖼 Отправить изображение / видео
          </button>
        </div>
      </Modal>

      <Modal open={rolePick} onClose={() => setRolePick(false)} title="Выбор роли">
        <div className="center-col gap-8">
          {roles.length === 0 && <p className="muted">Создайте роли в настройках профиля.</p>}
          {roles.map((r) => (
            <button key={r.id} className="btn row gap-12" style={{ justifyContent: 'flex-start' }}
              onClick={() => { onPickRole(r); setRolePick(false); }}>
              <Avatar src={r.avatar_url} name={r.name} size={26} />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ========================================================================
   Меню чата — состав пунктов зависит от системной роли пользователя.
   ======================================================================== */
export function ChatMenu({
  open, onClose, role, actions,
}: {
  open: boolean; onClose: () => void; role: MemberRole;
  actions: Record<string, () => void>;
}) {
  // Права по ТЗ
  const canTitle = role === 'creator' || role === 'admin';
  const canBackground = role === 'creator';
  const canRoles = role === 'creator' || role === 'admin';
  const canEvents = role === 'creator' || role === 'admin';

  const Item = ({ label, on }: { label: string; on?: () => void }) =>
    on ? (
      <button className="btn" style={{ justifyContent: 'flex-start', textAlign: 'left' }}
        onClick={() => { on(); onClose(); }}>{label}</button>
    ) : null;

  return (
    <Modal open={open} onClose={onClose} title="Меню чата">
      <div className="center-col gap-8">
        {canBackground && <Item label="🌑 Сменить фон" on={actions.background} />}
        {canTitle && <Item label="✏️ Сменить название" on={actions.title} />}
        {canTitle && <Item label="🖼 Сменить аватарку чата" on={actions.avatar} />}
        {canRoles && <Item label="➕ Добавить роль" on={actions.addRole} />}
        {canRoles && <Item label="🎭 Изменить роль" on={actions.editRole} />}
        {role === 'member' && <Item label="🎭 Выбрать роль" on={actions.selectRole} />}
        <Item label="👥 Посмотреть участников" on={actions.members} />
        <Item label="🗂 Роли участников" on={actions.memberRoles} />
        {canEvents && <Item label="📅 Добавить событие" on={actions.addEvent} />}
        <div style={{ height: 1, background: 'var(--panel-3)', margin: '4px 0' }} />
        <button className="btn btn-blood" onClick={() => { actions.leave(); onClose(); }}>
          Выйти из чата
        </button>
      </div>
    </Modal>
  );
}
