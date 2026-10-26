export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  group_id: string;
  assigned_to: string;
  created_by: string | null;
  title: string;
  description: string | null;
  due_date: string; // RRRR-MM-DD
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
};

export type TaskFormValues = {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
};
