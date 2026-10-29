import type { TaskStatus } from './types';

export const STATUS_META: Record<TaskStatus, { label: string; icon: string }> = {
  todo: { label: 'Do zrobienia', icon: 'checkbox-blank-circle-outline' },
  in_progress: { label: 'W trakcie', icon: 'progress-clock' },
  pending: { label: 'Czeka na zatwierdzenie', icon: 'timer-sand' },
  done: { label: 'Zrobione', icon: 'check-circle' },
};

// Kliknięcie w kółko statusu przełącza go po kolei.
// Dziecko oznacza "zrobione", a baza zamienia to na "czeka na zatwierdzenie".
// Dla rodzica kliknięcie zadania czekającego oznacza zatwierdzenie.
export function nextStatus(status: TaskStatus, isManager: boolean): TaskStatus {
  switch (status) {
    case 'todo':
      return 'in_progress';
    case 'in_progress':
      return 'done';
    case 'pending':
      return isManager ? 'done' : 'in_progress';
    case 'done':
      return 'todo';
  }
}

export function countDone(tasks: { status: TaskStatus }[]): number {
  return tasks.filter((task) => task.status === 'done').length;
}
