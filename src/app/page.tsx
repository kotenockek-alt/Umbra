'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/screens/AuthScreen';
import { ChatListScreen } from '@/components/screens/ChatListScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import type { Chat, Profile } from '@/types/db';

type View =
  | { name: 'list' }
  | { name: 'chat'; chat: Chat }
  | { name: 'settings' };

export default function Home() {
  const { userId, profile, loading, refresh, hasProfile } = useAuth();
  const [view, setView] = useState<View>({ name: 'list' });

  if (loading) {
    return (
      <main className="app-shell">
        <div className="center-col flicker" style={{ height: '100%', placeContent: 'center', alignItems: 'center' }}>
          <span className="title-display" style={{ fontSize: 40, color: 'var(--ember)' }}>Umbra</span>
        </div>
      </main>
    );
  }

  // Не авторизован или нет профиля → экран входа
  if (!userId || !hasProfile) {
    return (
      <main className="app-shell">
        <AuthScreen onDone={refresh} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {view.name === 'list' && (
        <ChatListScreen
          userId={userId}
          onOpenChat={(chat) => setView({ name: 'chat', chat })}
          onOpenSettings={() => setView({ name: 'settings' })}
          onOpenContact={(_p: Profile) => { /* TODO: открыть/создать личный чат */ }}
        />
      )}
      {view.name === 'chat' && (
        <ChatScreen chat={view.chat} userId={userId} onBack={() => setView({ name: 'list' })} />
      )}
      {view.name === 'settings' && profile && (
        <SettingsScreen profile={profile} onBack={() => setView({ name: 'list' })}
          onSaved={() => { refresh(); }} />
      )}
    </main>
  );
}
