// Zamienia błąd z Supabase na komunikat dla użytkownika.
// Komunikaty z naszych funkcji w bazie są już po polsku, więc je przepuszczamy.
export function toUserMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  const lower = message.toLowerCase();

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Nie masz uprawnień do tej operacji.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Brak połączenia z internetem.';
  }
  if (lower.includes('tasks_template_day_unique')) {
    return 'Na ten dzień jest już to zadanie z serii.';
  }
  if (lower.includes('violates check constraint')) {
    return 'Nieprawidłowe dane. Sprawdź pola formularza.';
  }
  return message || 'Coś poszło nie tak. Spróbuj ponownie.';
}
