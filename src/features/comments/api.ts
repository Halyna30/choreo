import { supabase } from '../../lib/supabase';

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

const COMMENT_COLUMNS = 'id, task_id, author_id, body, created_at';

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(COMMENT_COLUMNS)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskComment[];
}

export async function addComment(params: { taskId: string; body: string }): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: params.taskId, body: params.body.trim() })
    .select(COMMENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as TaskComment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data, error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Możesz usuwać tylko swoje komentarze.');
}
