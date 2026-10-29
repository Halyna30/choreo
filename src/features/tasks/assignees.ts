import type { Task, TaskAssignment } from './types';

// Czy zadanie dotyczy danej osoby (pokazujemy je na jej liście)
export function taskBelongsTo(task: Task, userId: string | undefined): boolean {
  if (!userId) return false;
  switch (task.assignment) {
    case 'single':
      return task.assigned_to === userId;
    case 'anyone':
      // przejęte – tylko u osoby, która je przejęła; wolne – u wszystkich uczestników
      return task.assigned_to ? task.assigned_to === userId : task.participant_ids.includes(userId);
    case 'together':
      return task.participant_ids.includes(userId);
  }
}

// Czy dana osoba może zmienić status (te same zasady co w bazie)
export function canChangeTaskStatus(
  task: Task,
  userId: string | undefined,
  isManager: boolean,
): boolean {
  if (isManager) return true;
  if (!userId || task.status === 'done' || task.status === 'pending') return false;
  if (task.assigned_to === userId) return true;
  if (task.assignment === 'together') return task.participant_ids.includes(userId);
  if (task.assignment === 'anyone' && !task.assigned_to) {
    return task.participant_ids.includes(userId);
  }
  return false;
}

// Czy dana osoba bierze udział w zadaniu (np. może je komentować)
export function isTaskPerson(task: Task, userId: string | undefined): boolean {
  if (!userId) return false;
  return task.assigned_to === userId || task.participant_ids.includes(userId);
}

export function assigneeIdsOf(item: {
  assignment: TaskAssignment;
  assigned_to: string | null;
  participant_ids: string[];
}): string[] {
  return item.assignment === 'single'
    ? item.assigned_to
      ? [item.assigned_to]
      : []
    : item.participant_ids;
}

// Opis "dla kogo", np. "Ola", "Ktokolwiek: Ola, Kuba", "Razem: Ola, Kuba"
export function describeAssignees(
  item: { assignment: TaskAssignment; assigned_to: string | null; participant_ids: string[] },
  nameOf: (userId: string) => string,
): string {
  if (item.assignment === 'single') {
    return item.assigned_to ? nameOf(item.assigned_to) : '—';
  }
  const names = item.participant_ids.map(nameOf).join(', ');
  if (item.assignment === 'together') return `Razem: ${names}`;
  return item.assigned_to ? `${nameOf(item.assigned_to)} (przejęte)` : `Ktokolwiek: ${names}`;
}
