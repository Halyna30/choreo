import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, deleteGoal, fetchBalances, fetchGoals, redeemGoal, updateGoal } from './api';

export const pointKeys = {
  balances: (groupId?: string) => ['points', groupId] as const,
  goals: (groupId?: string) => ['goals', groupId] as const,
};

// Saldo jako mapa: userId -> { stars, claps }
export function usePointBalances(groupId: string | undefined) {
  return useQuery({
    queryKey: pointKeys.balances(groupId),
    queryFn: () => fetchBalances(groupId as string),
    enabled: Boolean(groupId),
    select: (rows) => new Map(rows.map((row) => [row.user_id, row])),
  });
}

export function useGoals(groupId: string | undefined) {
  return useQuery({
    queryKey: pointKeys.goals(groupId),
    queryFn: () => fetchGoals(groupId as string),
    enabled: Boolean(groupId),
  });
}

function useInvalidateGoals(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: pointKeys.goals(groupId) });
    await queryClient.invalidateQueries({ queryKey: pointKeys.balances(groupId) });
  };
}

export function useCreateGoal(groupId: string | undefined) {
  const invalidate = useInvalidateGoals(groupId);
  return useMutation({ mutationFn: createGoal, onSuccess: () => invalidate() });
}

export function useUpdateGoal(groupId: string | undefined) {
  const invalidate = useInvalidateGoals(groupId);
  return useMutation({ mutationFn: updateGoal, onSuccess: () => invalidate() });
}

export function useDeleteGoal(groupId: string | undefined) {
  const invalidate = useInvalidateGoals(groupId);
  return useMutation({ mutationFn: deleteGoal, onSuccess: () => invalidate() });
}

export function useRedeemGoal(groupId: string | undefined) {
  const invalidate = useInvalidateGoals(groupId);
  return useMutation({ mutationFn: redeemGoal, onSuccess: () => invalidate() });
}
