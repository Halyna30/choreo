import { supabase } from '../../lib/supabase';

export type PointBalance = { user_id: string; stars: number; claps: number };

export type Goal = {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  emoji: string;
  stars_needed: number;
  status: 'active' | 'redeemed';
  redeemed_at: string | null;
  created_at: string;
};

const GOAL_COLUMNS =
  'id, group_id, user_id, title, emoji, stars_needed, status, redeemed_at, created_at';

export async function fetchBalances(groupId: string): Promise<PointBalance[]> {
  const { data, error } = await supabase.rpc('point_balances', { gid: groupId });
  if (error) throw error;
  return (data ?? []) as PointBalance[];
}

export async function fetchGoals(groupId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(GOAL_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(params: {
  groupId: string;
  title: string;
  emoji: string;
  starsNeeded: number;
}): Promise<void> {
  const { error } = await supabase.from('goals').insert({
    group_id: params.groupId,
    title: params.title.trim(),
    emoji: params.emoji,
    stars_needed: params.starsNeeded,
  });
  if (error) throw error;
}

export async function updateGoal(params: {
  id: string;
  title: string;
  emoji: string;
  starsNeeded: number;
}): Promise<void> {
  const { data, error } = await supabase
    .from('goals')
    .update({ title: params.title.trim(), emoji: params.emoji, stars_needed: params.starsNeeded })
    .eq('id', params.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Możesz zmieniać tylko swoje aktywne cele.');
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { data, error } = await supabase.from('goals').delete().eq('id', goalId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie możesz usunąć tego celu.');
}

export async function redeemGoal(goalId: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_goal', { p_goal_id: goalId });
  if (error) throw error;
}
