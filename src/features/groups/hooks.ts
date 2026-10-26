import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import {
  createGroup,
  createInvite,
  deleteInvite,
  fetchActiveInvites,
  fetchGroupMembers,
  fetchMyMemberships,
  joinGroup,
  removeMember,
  updateMember,
} from './api';

export const groupKeys = {
  memberships: (userId?: string) => ['memberships', userId] as const,
  members: (groupId?: string) => ['group-members', groupId] as const,
  invites: (groupId?: string) => ['group-invites', groupId] as const,
};

// MVP: użytkownik pracuje w pierwszej grupie, do której dołączył.
// Później można dodać przełączanie między grupami.
export function useCurrentMembership() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: groupKeys.memberships(userId),
    queryFn: () => fetchMyMemberships(userId as string),
    enabled: Boolean(userId),
    select: (memberships) => memberships[0] ?? null,
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => fetchGroupMembers(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useActiveInvites(groupId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: groupKeys.invites(groupId),
    queryFn: () => fetchActiveInvites(groupId as string),
    enabled: Boolean(groupId) && enabled,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memberships'] }),
  });
}

export function useCreateInvite(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.invites(groupId) }),
  });
}

export function useDeleteInvite(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.invites(groupId) }),
  });
}

export function useUpdateMember(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

export function useRemoveMember(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}
