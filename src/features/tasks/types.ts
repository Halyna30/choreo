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
  template_id: string | null; // zadanie utworzone z szablonu cyklicznego
};

// Szablon zadania cyklicznego
export type TaskTemplate = {
  id: string;
  group_id: string;
  assigned_to: string;
  created_by: string | null;
  title: string;
  description: string | null;
  weekdays: number[]; // ISO: 1 = poniedziałek ... 7 = niedziela
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export type RepeatMode = 'none' | 'daily' | 'weekdays';

export type TaskFormValues = {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string; // dla zadań cyklicznych: data rozpoczęcia
  repeat: RepeatMode;
  weekdays: number[];
};
