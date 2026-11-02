import type { TFunction } from 'i18next';
import type { GroupMember, GroupRole } from './types';

export function roleLabel(role: GroupRole, t: TFunction): string {
  return t(`roles.${role}`);
}

export const ROLE_ORDER: Record<GroupRole, number> = {
  owner: 0,
  adult: 1,
  child: 2,
};

export function canManageTasks(role: GroupRole | undefined): boolean {
  return role === 'owner' || role === 'adult';
}

// Etykieta ma pierwszeństwo przed imieniem z profilu
export function getMemberName(member: Pick<GroupMember, 'label' | 'profile'>, t: TFunction): string {
  return member.label?.trim() || member.profile?.display_name?.trim() || t('common.unnamed');
}

export function formatDate(isoDate: string, t: TFunction): string {
  return new Date(isoDate).toLocaleDateString(t('meta.dateLocale'), {
    day: 'numeric',
    month: 'long',
  });
}
