import type { TaskStatus } from './types';

export const STATUS_META: Record<TaskStatus, { label: string; icon: string }> = {
  todo: { label: 'Do zrobienia', icon: 'checkbox-blank-circle-outline' },
  in_progress: { label: 'W trakcie', icon: 'progress-clock' },
  done: { label: 'Zrobione', icon: 'check-circle' },
};

// Kliknięcie w ikonę przełącza status po kolei
export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export function countDone(tasks: { status: TaskStatus }[]): number {
  return tasks.filter((task) => task.status === 'done').length;
}
