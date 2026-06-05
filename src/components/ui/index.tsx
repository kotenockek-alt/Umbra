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
