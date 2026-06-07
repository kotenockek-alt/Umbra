'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usernameError } from '@/lib/username';

export function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      if (mode === 'register') {
        const ue = usernameError(username);
        if (ue) throw new Error(ue);

        // проверка уникальности username
        const { data: exists } = await supabase
          .from('profiles').select('id').ilike('username', username).maybeSingle();
        if (exists) throw new Error('Этот username уже занят');

        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        const uid = data.user?.id;
        if (uid) {
          const { error: pErr } = await supabase.from('profiles')
            .insert({ id: uid, name: name || 'Безымянный', username });
          if (pErr) throw new Error('Не удалось создать профиль: ' + pErr.message);
        }
        // сразу входим после регистрации, чтобы не вводить данные заново
        if (!data.session) {
          const { error: inErr } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (inErr) throw new Error('Регистрация прошла, но вход не удался: ' + inErr.message);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-col" style={{ height: '100%', justifyContent: 'center', padding: '0 28px', gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 className="title-display flicker" style={{ fontSize: 52, color: 'var(--ember)', textShadow: 'var(--glow-blood)' }}>
          Umbra
        </h1>
        <p className="muted" style={{ fontStyle: 'italic', marginTop: -4 }}>то, что шепчет из темноты</p>
      </div>

      {mode === 'register' && (
        <>
          <input className="input" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="username (буквы/цифры)" value={username}
            onChange={(e) => setUsername(e.target.value)} />
        </>
      )}
      <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} />

      {err && <p style={{ color: 'var(--ember)', fontSize: 13 }}>{err}</p>}

      <button className="btn btn-blood" disabled={busy} onClick={submit} style={{ fontSize: 16 }}>
        {busy ? '…' : mode === 'login' ? 'Войти' : 'Создать'}
      </button>
      <button className="btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null); }}>
        {mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}
