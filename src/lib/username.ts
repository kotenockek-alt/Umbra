// Правила username (по ТЗ):
//  • русские буквы  • английские буквы  • цифры
//  • остальные символы запрещены
//  • уникальность гарантируется БД (unique index по lower(username))

const USERNAME_RE = /^[A-Za-zА-Яа-яЁё0-9]+$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value) && value.length >= 3 && value.length <= 32;
}

// Текст ошибки для UI
export function usernameError(value: string): string | null {
  if (value.length < 3) return 'Минимум 3 символа';
  if (value.length > 32) return 'Максимум 32 символа';
  if (!USERNAME_RE.test(value))
    return 'Только русские/английские буквы и цифры';
  return null;
}
