import type { TFunction } from 'i18next';
import { pl } from '../i18n/locales/pl';

type ErrorKey = keyof typeof pl.errors;

// Funkcje w bazie i warstwa API rzucają komunikaty po polsku.
// Szukamy ich wśród polskich tłumaczeń i pokazujemy w wybranym języku.
const POLISH_TO_KEY = new Map(
  (Object.entries(pl.errors) as [ErrorKey, string][]).map(([key, text]) => [text, key]),
);

// 'Za mało gwiazdek: 3 z 10.' – jedyny komunikat z bazy z liczbami
const NOT_ENOUGH_STARS = /^Za mało gwiazdek: (\d+) z (\d+)\.$/;

function messageOf(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : '';
}

// Zamienia błąd z Supabase na komunikat dla użytkownika
export function toUserMessage(error: unknown, t: TFunction): string {
  const message = messageOf(error);

  const key = POLISH_TO_KEY.get(message);
  if (key) return t(`errors.${key}`);

  const stars = NOT_ENOUGH_STARS.exec(message);
  if (stars) return t('errors.notEnoughStars', { have: stars[1], need: stars[2] });

  const lower = message.toLowerCase();
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return t('errors.noPermission');
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return t('errors.offline');
  }
  if (lower.includes('tasks_template_day_unique')) {
    return t('errors.templateDayExists');
  }
  if (lower.includes('violates check constraint')) {
    return t('errors.invalidData');
  }
  return t('errors.generic');
}
