import type { GroupMember, GroupRole } from './types';

export const ROLE_LABELS: Record<GroupRole, string> = {
  owner: 'Zarządca',
  adult: 'Dorosły',
  child: 'Dziecko',
};

export const ROLE_ORDER: Record<GroupRole, number> = {
  owner: 0,
  adult: 1,
  child: 2,
};

export function canManageTasks(role: GroupRole | undefined): boolean {
  return role === 'owner' || role === 'adult';
}

// Etykieta ma pierwszeństwo przed imieniem z profilu
export function getMemberName(member: Pick<GroupMember, 'label' | 'profile'>): string {
  return member.label?.trim() || member.profile?.display_name?.trim() || 'Bez nazwy';
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  });
}
