import { getMemberName } from './roles';
import type { GroupMember } from './types';

// Szybkie pobieranie imienia i roli członka po jego id
export function memberLookup(members: GroupMember[] | undefined) {
  const byId = new Map((members ?? []).map((member) => [member.user_id, member]));
  return {
    get: (userId: string) => byId.get(userId),
    nameOf: (userId: string) => {
      const member = byId.get(userId);
      return member ? getMemberName(member) : '—';
    },
    isChild: (userId: string) => byId.get(userId)?.role === 'child',
  };
}
