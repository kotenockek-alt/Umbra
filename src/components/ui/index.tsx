'use client';

import React from 'react';

/* ---------- Аватар ---------- */
export function Avatar({
  src, name, size = 44, ring = false,
}: { src?: string | null; name?: string; size?: number; ring?: boolean }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: src ? `center/cover url(${src})` : 'var(--panel-3)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-display)', fontSize: size * 0.42, color: 'var(--ash)',
        flexShrink: 0,
        border: ring ? '2px solid var(--blood)' : '1px solid var(--panel-3)',
        boxShadow: ring ? 'var(--glow-blood)' : 'none',
      }}
    >
      {!src && initial}
    </div>
  );
}

/* ---------- Модальное окно (bottom-sheet на мобиле) ---------- */
export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rise"
        style={{
          width: '100%', maxWidth: 480, background: 'var(--panel)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          borderTop: '1px solid var(--panel-3)', boxShadow: 'var(--shadow-deep)',
          padding: '20px 18px 28px',
        }}
      >
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: 'var(--panel-3)',
          margin: '0 auto 16px',
        }} />
        {title && <h3 className="title-display" style={{ fontSize: 22, marginBottom: 14 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Иконки (inline SVG, без зависимостей) ---------- */
type IconProps = { size?: number; color?: string };
const base = (size: number, color: string) => ({
  width: size, height: size, fill: 'none',
  stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const IconSettings = ({ size = 22, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
export const IconPlus = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconSearch = ({ size = 18, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconSend = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
);
export const IconExit = ({ size = 22, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconBack = ({ size = 24, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);

/* ---- Иконки для пунктов меню (в акцентном цвете) ---- */
export const IconMask = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <path d="M3 5s2 1 9 1 9-1 9-1v6a9 9 0 0 1-18 0V5z" /><circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" /><path d="M9 15c1 1 5 1 6 0" />
  </svg>
);
export const IconImage = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 16-5-5L5 20" />
  </svg>
);
export const IconChat = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" /></svg>
);
export const IconUserPlus = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M19 8v6M16 11h6" />
  </svg>
);
export const IconMoon = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);
export const IconEdit = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
);
export const IconRolePlus = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /><path d="M12 11v4M10 13h4" /></svg>
);
export const IconUsers = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-5-5.9" />
  </svg>
);
export const IconList = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const IconCalendar = ({ size = 20, color = 'currentColor' }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, color)}>
    <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
