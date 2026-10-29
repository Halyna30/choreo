export type TaskStatus = 'todo' | 'in_progress' | 'pending' | 'done';

// single = jedna osoba, anyone = ktokolwiek z uczestników, together = wszyscy razem
export type TaskAssignment = 'single' | 'anyone' | 'together';

export type Task = {
  id: string;
  group_id: string;
  assignment: TaskAssignment;
  assigned_to: string | null; // osoba (single) albo ta, która przejęła zadanie (anyone)
  participant_ids: string[]; // uczestnicy zadań anyone / together
  created_by: string | null;
  completed_by: string | null;
  approved_by: string | null;
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
  assignment: TaskAssignment;
  assigned_to: string | null;
  participant_ids: string[];
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
  assigneeIds: string[];
  assignment: TaskAssignment;
  dueDate: string; // dla zadań cyklicznych: data rozpoczęcia
  repeat: RepeatMode;
  weekdays: number[];
};
