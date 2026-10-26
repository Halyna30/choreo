import { supabase } from '../../lib/supabase';
import type { Task, TaskStatus, TaskTemplate } from './types';

const TASK_COLUMNS =
  'id, group_id, assigned_to, created_by, title, description, due_date, status, completed_at, created_at, template_id';

const TEMPLATE_COLUMNS =
  'id, group_id, assigned_to, created_by, title, description, weekdays, start_date, end_date, is_active, created_at';

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ---------- Zadania ----------

export async function fetchTasksForDay(groupId: string, date: string): Promise<Task[]> {
  // Najpierw baza tworzy brakujące zadania cykliczne na ten dzień
  const { error: ensureError } = await supabase.rpc('ensure_tasks_for_day', {
    gid: groupId,
    day: date,
  });
  if (ensureError) throw ensureError;

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

// ---------- Szablony zadań cyklicznych ----------

export async function fetchTemplates(groupId: string): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select(TEMPLATE_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskTemplate[];
}

export async function fetchTemplate(templateId: string): Promise<TaskTemplate | null> {
  const { data, error } = await supabase
    .from('task_templates')
    .select(TEMPLATE_COLUMNS)
    .eq('id', templateId)
    .maybeSingle();

  if (error) throw error;
  return data as TaskTemplate | null;
}

export async function createTemplate(params: {
  groupId: string;
  assignedTo: string;
  title: string;
  description?: string;
  weekdays: number[];
  startDate: string;
}): Promise<TaskTemplate> {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      group_id: params.groupId,
      assigned_to: params.assignedTo,
      title: params.title.trim(),
      description: emptyToNull(params.description),
      weekdays: params.weekdays,
      start_date: params.startDate,
    })
    .select(TEMPLATE_COLUMNS)
    .single();

  if (error) throw error;
  return data as TaskTemplate;
}

export async function updateTemplate(params: {
  id: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  weekdays?: number[];
  startDate?: string;
  isActive?: boolean;
}): Promise<void> {
  const changes: Record<string, unknown> = {};
  if (params.title !== undefined) changes.title = params.title.trim();
  if (params.description !== undefined) changes.description = emptyToNull(params.description);
  if (params.assignedTo !== undefined) changes.assigned_to = params.assignedTo;
  if (params.weekdays !== undefined) changes.weekdays = params.weekdays;
  if (params.startDate !== undefined) changes.start_date = params.startDate;
  if (params.isActive !== undefined) changes.is_active = params.isActive;

  const { data, error } = await supabase
    .from('task_templates')
    .update(changes)
    .eq('id', params.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie masz uprawnień do tej operacji.');
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { data, error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', templateId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie masz uprawnień do tej operacji.');
}
