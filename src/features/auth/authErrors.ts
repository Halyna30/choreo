// Tłumaczy najczęstsze błędy Supabase Auth na komunikaty po polsku
export function getAuthErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Nieprawidłowy e-mail lub hasło.';
  }
  if (message.includes('user already registered')) {
    return 'Konto z tym adresem e-mail już istnieje.';
  }
  if (message.includes('email not confirmed')) {
    return 'Potwierdź adres e-mail, klikając link w wiadomości.';
  }
  if (message.includes('password should be at least')) {
    return 'Hasło jest za krótkie.';
  }
  if (message.includes('unable to validate email') || message.includes('invalid format')) {
    return 'Nieprawidłowy adres e-mail.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Brak połączenia z internetem.';
  }
  return 'Coś poszło nie tak. Spróbuj ponownie.';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 6;
