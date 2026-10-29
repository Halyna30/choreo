export type GroupRole = 'owner' | 'adult' | 'child';
export type InviteRole = Exclude<GroupRole, 'owner'>;

export type Group = {
  id: string;
  name: string;
};

// Członkostwo zalogowanego użytkownika
export type Membership = {
  group_id: string;
  role: GroupRole;
  label: string | null;
  joined_at: string;
  group: Group;
};

// Członek grupy widoczny na liście
export type GroupMember = {
  user_id: string;
  role: GroupRole;
  label: string | null;
  joined_at: string;
  profile: { display_name: string; avatar_url: string | null } | null;
};

export type GroupInvite = {
  id: string;
  code: string;
  role: InviteRole;
  label: string | null;
  expires_at: string;
  created_at: string;
};
