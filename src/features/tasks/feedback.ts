import type { Task, TaskStatus } from './types';

// Krótki komunikat po zmianie statusu – pochwała, gwiazdka albo klepnięcie po plecach
export function statusFeedback(params: {
  task: Task;
  status: TaskStatus;
  isManager: boolean;
  userId: string | undefined;
  nameOf: (userId: string) => string;
  isChild: (userId: string) => boolean;
}): string | null {
  const { task, status, isManager, userId, nameOf, isChild } = params;
  if (status !== 'done') return null;

  if (!isManager) return 'Super robota! Zadanie czeka na zatwierdzenie rodzica ⭐';

  const doers =
    task.assignment === 'together'
      ? task.participant_ids
      : [task.completed_by ?? task.assigned_to].filter((id): id is string => Boolean(id));

  if (task.status === 'pending' || doers.some(isChild)) {
    const kids = doers.filter(isChild).map(nameOf);
    return kids.length > 0
      ? `Zatwierdzone! ⭐ dla: ${kids.join(', ')}`
      : 'Zadanie zatwierdzone ✅';
  }

  if (userId && doers.includes(userId)) return 'Klepnięcie po plecach – dobra robota! 👏';
  return 'Zadanie oznaczone jako zrobione ✅';
}
