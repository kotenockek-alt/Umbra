# 🜲 Umbra — мрачный хоррор-мессенджер (PWA)

Полноценный Progressive Web App в стиле современного мессенджера с хоррор/мистической
атмосферой. Работает в браузере на **Android, iPhone и ПК**, ставится на главный экран.

Стек: **Next.js 14 (App Router) + TypeScript + Supabase (Auth / Postgres / Storage / Realtime)**.

---

## 1. Архитектура проекта

```
umbra-messenger/
├── public/
│   ├── manifest.json          # PWA-манифест (иконки, цвета, display)
│   ├── sw.js                  # Service Worker (офлайн-кеш, установка)
│   ├── icon-192.png           # иконка PWA
│   └── icon-512.png
│
├── supabase/
│   └── schema.sql             # вся схема БД + RLS-политики (выполнить в SQL Editor)
│
├── src/
│   ├── types/
│   │   └── db.ts              # TypeScript-типы всех сущностей
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # клиент для браузера
│   │   │   └── server.ts      # клиент для серверных компонентов
│   │   ├── username.ts        # валидация username (рус/англ/цифры)
│   │   └── storage.ts         # загрузка аватарок / фонов / фото / видео
│   │
│   ├── hooks/
│   │   ├── useAuth.ts         # текущий пользователь + профиль
│   │   ├── useChats.ts        # список чатов + поиск
│   │   ├── useMessages.ts     # сообщения чата + realtime-подписка
│   │   └── useRoles.ts        # пользовательские роли
│   │
│   ├── components/
│   │   ├── ui/                # атомы дизайн-системы (кнопки, модалки, аватар)
│   │   ├── chat/              # MessageBubble, EventLine, Composer, ChatHeader, ChatMenu
│   │   ├── list/              # ChatListItem, ContactItem, Tabs, SearchBar, TopBar
│   │   └── settings/          # ProfileEditor, RoleManager
│   │
│   └── app/
│       ├── layout.tsx         # корневой layout, регистрация SW, шрифты
│       ├── globals.css        # дизайн-система (CSS-переменные, хоррор-тема)
│       ├── page.tsx           # роутер состояния: auth → список → чат → настройки
│       ├── (auth)/login       # вход / регистрация
│       └── manifest-route...
│
├── next.config.js
├── tsconfig.json
└── package.json
```

### Поток данных

```
React-компоненты
   │  (hooks)
   ▼
Supabase JS client ──► Postgres (RLS-политики защищают доступ по ролям)
   │                     ▲
   │ Realtime            │ Storage (аватары, фоны, фото, видео)
   └─────────────────────┘
```

---

## 2. Структура базы данных

Полный SQL — в [`supabase/schema.sql`](./supabase/schema.sql). Кратко:

| Таблица            | Назначение |
|--------------------|------------|
| `profiles`         | имя, **уникальный username**, аватар. Привязан к `auth.users`. |
| `user_roles`       | пользовательские роли (название + аватар), используются в любых чатах. |
| `contacts`         | связи «контакт», локальное переименование (`custom_name`). |
| `chats`            | чат: название, аватар, фон, создатель, флаг `is_group`. |
| `chat_members`     | участники + системная роль (`creator`/`admin`/`member`) + выбранная роль. |
| `messages`         | текст / фото / видео + `role_id` (роль, под которой отправлено). |
| `events`           | системные события чата («Создана роль Охотник»). |

**Username** ограничивается на трёх уровнях: в UI (`lib/username.ts`), `CHECK`-констрейнтом
(`~ '^[A-Za-zА-Яа-яЁё0-9]+$'`) и `UNIQUE`-индексом → дубликат создать невозможно.

**Защита по ролям** реализована через Row Level Security: например, менять `background_url`
чата может только создатель, `title`/`avatar` — создатель и админ, и т.д.

---

## 3. Запуск

```bash
# 1. Установить зависимости
npm install

# 2. Создать проект на supabase.com, выполнить supabase/schema.sql в SQL Editor

# 3. Создать .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx

# 4. В Supabase Storage создать публичные бакеты: avatars, backgrounds, media

# 5. Запустить
npm run dev        # http://localhost:3000
```

Для установки как PWA: открыть сайт по HTTPS → «Добавить на главный экран».

---

## 4. Что уже реализовано в каркасе

- ✅ Авторизация (email/пароль) + создание профиля с уникальным username
- ✅ Дизайн-система: чёрный фон, тёмно-серые панели, тени, grain-текстура, анимации
- ✅ Список чатов: верхняя панель (настройки / плюс), поиск, вкладки Истории/Контакты
- ✅ Экран чата: минимальная шапка (аватар / название / выход), меню по тапу
- ✅ Сообщения в стиле Telegram (белый пузырь, чёрный текст, роль под сообщением)
- ✅ События по центру серым текстом
- ✅ Композер с меню (роль / фото / видео)
- ✅ Система ролей (системные + пользовательские) и права по ролям через RLS
- ✅ Контакты, поиск по username, локальное переименование
- ✅ PWA: manifest + service worker

Каркас спроектирован модульно — каждый экран и hook расширяется независимо.
