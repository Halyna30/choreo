import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  createTask,
  createTemplate,
  deleteTask,
  deleteTemplate,
  fetchTask,
  fetchTasksForDay,
  fetchTemplate,
  fetchTemplates,
  updateTask,
  updateTaskStatus,
  updateTemplate,
} from './api';
import type { Task } from './types';

export const taskKeys = {
  group: (groupId?: string) => ['tasks', groupId] as const,
  day: (groupId?: string, date?: string) => ['tasks', groupId, date] as const,
  detail: (taskId?: string) => ['task', taskId] as const,
};

export const templateKeys = {
  list: (groupId?: string) => ['templates', groupId] as const,
  detail: (templateId?: string) => ['template', templateId] as const,
};

// ---------- Zadania ----------

export function useTasksForDay(groupId: string | undefined, date: string) {
  return useQuery({
    queryKey: taskKeys.day(groupId, date),
    queryFn: () => fetchTasksForDay(groupId as string, date),
    enabled: Boolean(groupId),
  });
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => fetchTask(taskId as string),
    enabled: Boolean(taskId),
  });
}

function useInvalidateTasks(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return async (taskId?: string) => {
    await queryClient.invalidateQueries({ queryKey: taskKeys.group(groupId) });
    if (taskId) {
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    }
  };
}

export function useCreateTask(groupId: string | undefined) {
  const invalidate = useInvalidateTasks(groupId);
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTask(groupId: string | undefined) {
  const invalidate = useInvalidateTasks(groupId);
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useDeleteTask(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks(groupId);
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: async (_data, taskId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
      await invalidate();
    },
  });
}

// Optymistyczna aktualizacja: status zmienia się na ekranie od razu,
// a jeśli serwer zwróci błąd, przywracamy poprzedni stan.
export function useUpdateTaskStatus(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks(groupId);

  return useMutation({
    mutationFn: updateTaskStatus,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.group(groupId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      const previousLists = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.group(groupId),
      });
      const previousDetail = queryClient.getQueryData<Task | null>(taskKeys.detail(id));

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.group(groupId) }, (old) =>
        old?.map((task) => (task.id === id ? { ...task, status } : task)),
      );
      if (previousDetail) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), { ...previousDetail, status });
      }

      return { previousLists, previousDetail };
    },
    onError: (_error, variables, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousDetail) {
        queryClient.setQueryData(taskKeys.detail(variables.id), context.previousDetail);
      }
    },
    onSettled: (_data, _error, variables) => invalidate(variables.id),
  });
}

// ---------- Szablony zadań cyklicznych ----------

export function useTemplates(groupId: string | undefined) {
  return useQuery({
    queryKey: templateKeys.list(groupId),
    queryFn: () => fetchTemplates(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useTemplate(templateId: string | null | undefined) {
  return useQuery({
    queryKey: templateKeys.detail(templateId ?? undefined),
    queryFn: () => fetchTemplate(templateId as string),
    enabled: Boolean(templateId),
  });
}

// Zmiana szablonu zmienia też przyszłe zadania, więc odświeżamy obie listy
function useInvalidateTemplates(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return async (templateId?: string) => {
    await queryClient.invalidateQueries({ queryKey: templateKeys.list(groupId) });
    if (templateId) {
      await queryClient.invalidateQueries({ queryKey: templateKeys.detail(templateId) });
    }
    await queryClient.invalidateQueries({ queryKey: taskKeys.group(groupId) });
    await queryClient.invalidateQueries({ queryKey: ['task'] });
  };
}

export function useCreateTemplate(groupId: string | undefined) {
  const invalidate = useInvalidateTemplates(groupId);
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTemplate(groupId: string | undefined) {
  const invalidate = useInvalidateTemplates(groupId);
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useDeleteTemplate(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTemplates(groupId);
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: async (_data, templateId) => {
      queryClient.removeQueries({ queryKey: templateKeys.detail(templateId) });
      await invalidate();
    },
  });
}

// ---------- Realtime ----------

// Nasłuchuje zmian w zadaniach grupy (Supabase Realtime).
// Gdy ktoś doda zadanie albo zmieni status, odświeżamy listy.
export function useTasksRealtime(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`tasks:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: taskKeys.group(groupId) });
          const changedId =
            (payload.new as Partial<Task>)?.id ?? (payload.old as Partial<Task>)?.id;
          if (changedId) {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(changedId) });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
