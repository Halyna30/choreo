import { supabase } from '../../lib/supabase';
import type { Task, TaskAssignment, TaskStatus, TaskTemplate } from './types';

const TASK_COLUMNS =
  'id, group_id, assignment, assigned_to, created_by, completed_by, approved_by, title, description, due_date, status, completed_at, created_at, template_id, participants:task_participants(user_id)';

const TEMPLATE_COLUMNS =
  'id, group_id, assignment, assigned_to, participant_ids, created_by, title, description, weekdays, start_date, end_date, is_active, created_at';

type TaskRow = Omit<Task, 'participant_ids'> & { participants: { user_id: string }[] | null };

function toTask(row: TaskRow): Task {
  const { participants, ...task } = row;
  return { ...task, participant_ids: (participants ?? []).map((p) => p.user_id) };
}

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
  return ((data ?? []) as unknown as TaskRow[]).map(toTask);
}

// Wszystkie zadania czekające na zatwierdzenie (z każdego dnia)
export async function fetchPendingTasks(groupId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as TaskRow[]).map(toTask);
}

export async function fetchTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('id', taskId)
    .maybeSingle();

  if (error) throw error;
  return data ? toTask(data as unknown as TaskRow) : null;
}

// Tworzy (taskId = null) albo zmienia zadanie dla jednej lub wielu osób
export async function saveTask(params: {
  groupId: string;
  taskId: string | null;
  title: string;
  description?: string;
  dueDate: string;
  assignment: TaskAssignment;
  assigneeIds: string[];
}): Promise<void> {
  const { error } = await supabase.rpc('save_group_task', {
    p_group_id: params.groupId,
    p_task_id: params.taskId,
    p_title: params.title,
    p_description: params.description ?? '',
    p_due_date: params.dueDate,
    p_assignment: params.assignment,
    p_assignee_ids: params.assigneeIds,
  });

  if (error) throw error;
}

export async function updateTaskStatus(params: { id: string; status: TaskStatus }): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: params.status })
    .eq('id', params.id)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie możesz zmienić statusu tego zadania.');
}

export async function deleteTask(taskId: string): Promise<void> {
  const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nie masz uprawnień do tej operacji.');
}

// ---------- Szablony zadań cyklicznych ----------

function templateAssignees(assignment: TaskAssignment, assigneeIds: string[]) {
  return assignment === 'single'
    ? { assigned_to: assigneeIds[0], participant_ids: [] as string[] }
    : { assigned_to: null, participant_ids: assigneeIds };
}

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
  assignment: TaskAssignment;
  assigneeIds: string[];
  title: string;
  description?: string;
  weekdays: number[];
  startDate: string;
}): Promise<TaskTemplate> {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      group_id: params.groupId,
      assignment: params.assignment,
      ...templateAssignees(params.assignment, params.assigneeIds),
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
  assignment?: TaskAssignment;
  assigneeIds?: string[];
  weekdays?: number[];
  startDate?: string;
  isActive?: boolean;
}): Promise<void> {
  const changes: Record<string, unknown> = {};
  if (params.title !== undefined) changes.title = params.title.trim();
  if (params.description !== undefined) changes.description = emptyToNull(params.description);
  if (params.assignment !== undefined && params.assigneeIds !== undefined) {
    changes.assignment = params.assignment;
    Object.assign(changes, templateAssignees(params.assignment, params.assigneeIds));
  }
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
