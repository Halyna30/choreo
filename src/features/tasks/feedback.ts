import type { TFunction } from 'i18next';
import type { Task, TaskStatus } from './types';

// Krótki komunikat po zmianie statusu – pochwała, gwiazdka albo klepnięcie po plecach
export function statusFeedback(params: {
  task: Task;
  status: TaskStatus;
  isManager: boolean;
  userId: string | undefined;
  nameOf: (userId: string) => string;
  isChild: (userId: string) => boolean;
  t: TFunction;
}): string | null {
  const { task, status, isManager, userId, nameOf, isChild, t } = params;
  if (status !== 'done') return null;

  if (!isManager) return t('feedback.waitingForParent');

  const doers =
    task.assignment === 'together'
      ? task.participant_ids
      : [task.completed_by ?? task.assigned_to].filter((id): id is string => Boolean(id));

  if (task.status === 'pending' || doers.some(isChild)) {
    const kids = doers.filter(isChild).map(nameOf);
    return kids.length > 0
      ? t('feedback.approvedFor', { names: kids.join(', ') })
      : t('feedback.approved');
  }

  if (userId && doers.includes(userId)) return t('feedback.pat');
  return t('feedback.markedDone');
}
