import type { TFunction } from 'i18next';

// Tłumaczy najczęstsze błędy Supabase Auth na komunikaty w wybranym języku
export function getAuthErrorMessage(error: { message: string }, t: TFunction): string {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return t('errors.invalidCredentials');
  }
  if (message.includes('user already registered')) {
    return t('errors.userExists');
  }
  if (message.includes('email not confirmed')) {
    return t('errors.emailNotConfirmed');
  }
  if (message.includes('password should be at least')) {
    return t('errors.passwordTooShort');
  }
  if (message.includes('unable to validate email') || message.includes('invalid format')) {
    return t('errors.invalidEmail');
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return t('errors.rateLimit');
  }
  if (message.includes('network') || message.includes('fetch')) {
    return t('errors.offline');
  }
  return t('errors.generic');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 6;
