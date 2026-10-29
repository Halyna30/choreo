import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { addComment, deleteComment, fetchComments } from './api';

export const commentKeys = {
  list: (taskId?: string) => ['task-comments', taskId] as const,
};

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.list(taskId),
    queryFn: () => fetchComments(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => addComment({ taskId: taskId as string, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) }),
  });
}

export function useDeleteComment(taskId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) }),
  });
}

// Nowe komentarze pojawiają się na żywo, gdy okienko zadania jest otwarte
export function useCommentsRealtime(taskId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);
}
