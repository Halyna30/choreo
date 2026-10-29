import { supabase } from '../../lib/supabase';
import { ROLE_ORDER } from './roles';
import type { Group, GroupInvite, GroupMember, GroupRole, InviteRole, Membership } from './types';

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function fetchMyMemberships(userId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, label, joined_at, group:groups(id, name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Membership[];
}

export async function createGroup(params: { name: string; label?: string }): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', {
    group_name: params.name.trim(),
    my_label: emptyToNull(params.label),
  });

  if (error) throw error;
  return data as Group;
}

export async function joinGroup(code: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group', { invite_code: code.trim() });

  if (error) throw error;
  return data as Group;
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, role, label, joined_at, profile:profiles(display_name, avatar_url)')
    .eq('group_id', groupId);

  if (error) throw error;

  const members = (data ?? []) as unknown as GroupMember[];
  // Najpierw zarządca, potem dorośli, potem dzieci; w ramach roli wg daty dołączenia
  return members.sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.joined_at.localeCompare(b.joined_at),
  );
}

export async function fetchActiveInvites(groupId: string): Promise<GroupInvite[]> {
  const { data, error } = await supabase
    .from('group_invites')
    .select('id, code, role, label, expires_at, created_at')
    .eq('group_id', groupId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as GroupInvite[];
}

export async function createInvite(params: {
  groupId: string;
  role: InviteRole;
  label?: string;
}): Promise<GroupInvite> {
  const { data, error } = await supabase
    .from('group_invites')
    .insert({ group_id: params.groupId, role: params.role, label: emptyToNull(params.label) })
    .select('id, code, role, label, expires_at, created_at')
    .single();

  if (error) throw error;
  return data as GroupInvite;
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('group_invites').delete().eq('id', inviteId);
  if (error) throw error;
}

export async function updateMember(params: {
  groupId: string;
  userId: string;
  label?: string | null;
  role?: GroupRole;
}): Promise<void> {
  const changes: { label?: string | null; role?: GroupRole } = {};
  if (params.label !== undefined) changes.label = emptyToNull(params.label);
  if (params.role !== undefined) changes.role = params.role;

  const { data, error } = await supabase
    .from('group_members')
    .update(changes)
    .eq('group_id', params.groupId)
    .eq('user_id', params.userId)
    .select('user_id');

  if (error) throw error;
  // RLS nie zwraca błędu, tylko pomija wiersz – sprawdzamy, czy coś się zmieniło
  if (!data || data.length === 0) {
    throw new Error('Nie masz uprawnień do tej operacji.');
  }
}

export async function removeMember(params: { groupId: string; userId: string }): Promise<void> {
  const { data, error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.groupId)
    .eq('user_id', params.userId)
    .select('user_id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Nie masz uprawnień do tej operacji.');
  }
}
