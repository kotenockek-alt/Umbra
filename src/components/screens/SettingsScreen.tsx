'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { useStickers } from '@/hooks/useStickers';
import { usernameError } from '@/lib/username';
import { uploadFile } from '@/lib/storage';
import { Avatar, Modal, IconBack } from '@/components/ui';
import type { Profile } from '@/types/db';

export function SettingsScreen({
  profile, onBack, onSaved,
}: { profile: Profile; onBack: () => void; onSaved: () => void }) {
  const { roles, createRole, deleteRole } = useRoles(profile.id);
  const { stickers, addSticker, deleteSticker } = useStickers(profile.id);
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [err, setErr] = useState<string | null>(null);
  const [roleModal, setRoleModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleFile, setRoleFile] = useState<File | undefined>();

  const saveProfile = async () => {
    setErr(null);
    const ue = usernameError(username);
    if (ue) { setErr(ue); return; }
    if (username.toLowerCase() !== profile.username.toLowerCase()) {
      const { data: exists } = await supabase
        .from('profiles').select('id').ilike('username', username).maybeSingle();
      if (exists) { setErr('username занят'); return; }
    }
    const { error } = await supabase.from('profiles')
      .update({ name, username }).eq('id', profile.id);
    if (error) { setErr(error.message); return; }
    onSaved();
  };

  const changeAvatar = async (file: File) => {
    const url = await uploadFile('avatars', file);
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    onSaved();
  };

  return (
    <div className="center-col" style={{ height: '100%' }}>
      <div className="row gap-12" style={{ padding: '14px', borderBottom: '1px solid var(--panel-3)' }}>
        <button className="btn-icon" onClick={onBack}><IconBack color="var(--ash)" /></button>
        <h2 className="title-display" style={{ fontSize: 22 }}>Настройки</h2>
      </div>

      <div className="grow" style={{ overflowY: 'auto', padding: 18 }}>
        <div className="center-col" style={{ alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <label style={{ cursor: 'pointer' }}>
            <Avatar src={profile.avatar_url} name={profile.name} size={92} ring />
            <input type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) changeAvatar(f); }} />
          </label>
          <span className="muted" style={{ fontSize: 12 }}>нажмите, чтобы сменить аватар</span>
        </div>

        <label className="muted" style={{ fontSize: 13 }}>Имя</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ margin: '6px 0 14px' }} />

        <label className="muted" style={{ fontSize: 13 }}>Username</label>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} style={{ margin: '6px 0 14px' }} />

        {err && <p style={{ color: 'var(--ember)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button className="btn btn-blood" onClick={saveProfile} style={{ width: '100%' }}>Сохранить профиль</button>

        {/* Роли пользователя */}
        <div className="row between" style={{ margin: '26px 0 12px' }}>
          <h3 className="title-display" style={{ fontSize: 20 }}>Мои роли</h3>
          <button className="btn" onClick={() => setRoleModal(true)}>+ Роль</button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          Используются при отправке сообщений в любых чатах.
        </p>

        {roles.map((r) => (
          <div key={r.id} className="row between" style={{
            padding: '10px 12px', background: 'var(--panel)', borderRadius: 12, marginBottom: 8,
          }}>
            <div className="row gap-12">
              <Avatar src={r.avatar_url} name={r.name} size={36} />
              <span>{r.name}</span>
            </div>
            <button className="btn" onClick={() => deleteRole(r.id)} style={{ padding: '6px 10px', color: 'var(--ember)' }}>
              удалить
            </button>
          </div>
        ))}

        {/* Стикеры */}
        <div className="row between" style={{ margin: '26px 0 12px' }}>
          <h3 className="title-display" style={{ fontSize: 20 }}>Мои стикеры</h3>
          <label className="btn" style={{ cursor: 'pointer' }}>
            + Стикер
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) { const url = await uploadFile('media', f); await addSticker(url); }
              e.target.value = '';
            }} />
          </label>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          Загрузите картинки — их можно отправлять в любых чатах через меню «плюс».
        </p>

        <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
          {stickers.map((s) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <img src={s.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--panel-3)' }} />
              <button onClick={() => deleteSticker(s.id)}
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--blood)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
          {stickers.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Пока нет стикеров.</p>}
        </div>
      </div>

      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Новая роль">
        <div className="center-col gap-12">
          <input className="input" placeholder="Название роли" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
          <input type="file" accept="image/*" className="input" onChange={(e) => setRoleFile(e.target.files?.[0])} />
          <button className="btn btn-blood" onClick={async () => {
            const url = roleFile ? await uploadFile('avatars', roleFile) : null;
            await createRole(roleName, url);
            setRoleName(''); setRoleFile(undefined); setRoleModal(false);
          }}>Создать роль</button>
        </div>
      </Modal>

      {/* Выход из аккаунта */}
      <div style={{ padding: '20px 16px 32px' }}>
        <button className="btn" style={{ width: '100%', color: 'var(--ember)', border: '1px solid var(--panel-3)' }}
          onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
