import type { TFunction } from 'i18next';
import type { TaskStatus } from './types';

export const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: 'checkbox-blank-circle-outline',
  in_progress: 'progress-clock',
  pending: 'timer-sand',
  done: 'check-circle',
};

export function statusLabel(status: TaskStatus, t: TFunction): string {
  return t(`status.${status}`);
}

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
