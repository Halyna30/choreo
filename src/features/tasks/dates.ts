import type { TFunction } from 'i18next';

// Daty zadań trzymamy jako tekst RRRR-MM-DD w lokalnej strefie czasowej.
// Nie używamy toISOString(), bo zamienia czas na UTC i po północy
// potrafi przesunąć datę o jeden dzień.

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function formatDayLabel(key: string, t: TFunction): string {
  const today = todayKey();
  if (key === today) return t('dates.today');
  if (key === addDays(today, 1)) return t('dates.tomorrow');
  if (key === addDays(today, -1)) return t('dates.yesterday');
  return fromDateKey(key).toLocaleDateString(t('meta.dateLocale'), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(key: string, t: TFunction): string {
  return fromDateKey(key).toLocaleDateString(t('meta.dateLocale'), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
