import { supabase } from '../../lib/supabase';
import type { Task, TaskStatus } from './types';

const TASK_COLUMNS =
  'id, group_id, assigned_to, created_by, title, description, due_date, status, completed_at, created_at';

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function fetchTasksForDay(groupId: string, date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('group_id', groupId)
    .eq('due_date', date)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('id', taskId)
    .maybeSingle();

  if (error) throw error;
  return data as Task | null;
}

export async function createTask(params: {
  groupId: string;
  assignedTo: string;
  title: string;
  description?: string;
  dueDate: string;
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      group_id: params.groupId,
      assigned_to: params.assignedTo,
      title: params.title.trim(),
      description: emptyToNull(params.description),
      due_date: params.dueDate,
    })
    .select(TASK_COLUMNS)
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(params: {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate: string;
}): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: params.title.trim(),
      description: emptyToNull(params.description),
      assigned_to: params.assignedTo,
      due_date: params.dueDate,
    })
    .eq('id', params.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie masz uprawnień do tej operacji.');
}

export async function updateTaskStatus(params: { id: string; status: TaskStatus }): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: params.status })
    .eq('id', params.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Możesz zmieniać tylko status swoich zadań.');
}

export async function deleteTask(taskId: string): Promise<void> {
  const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie masz uprawnień do tej operacji.');
}
