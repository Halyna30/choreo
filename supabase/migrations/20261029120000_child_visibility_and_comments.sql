-- =============================================================
-- Choreo – widoczność zadań dla dzieci i komentarze do zadań
-- 1. Dziecko widzi tylko zadania dzieci (swoje i rodzeństwa), nie widzi zadań dorosłych.
-- 2. Komentarze: dziecko komentuje swoje zadanie w trakcie lub zrobione,
--    zarządca i dorośli mogą komentować każde zadanie.
-- =============================================================

-- ---------- Funkcje pomocnicze ----------

-- Rola dowolnego członka grupy
create or replace function public.member_role(gid uuid, uid uuid)
returns public.group_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.group_members
  where group_id = gid and user_id = uid;
$$;

-- Czy zalogowany użytkownik może widzieć zadania danej osoby
create or replace function public.can_view_member_tasks(gid uuid, assignee uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_group_member(gid)
    and (
      public.can_manage_tasks(gid)               -- zarządca i dorośli widzą wszystko
      or assignee = auth.uid()                   -- każdy widzi swoje
      or public.member_role(gid, assignee) = 'child' -- dziecko widzi zadania dzieci
    );
$$;

-- ---------- Zadania i szablony: nowa zasada odczytu ----------
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select to authenticated
  using (public.can_view_member_tasks(group_id, assigned_to));

drop policy if exists "templates_select" on public.task_templates;
create policy "templates_select" on public.task_templates
  for select to authenticated
  using (public.can_view_member_tasks(group_id, assigned_to));

-- ---------- Komentarze ----------
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index task_comments_task_idx on public.task_comments (task_id, created_at);

create or replace function public.can_view_task(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = tid and public.can_view_member_tasks(t.group_id, t.assigned_to)
  );
$$;

create or replace function public.can_comment_task(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = tid
      and (
        public.can_manage_tasks(t.group_id)
        or (t.assigned_to = auth.uid() and t.status in ('in_progress', 'done'))
      )
  );
$$;

alter table public.task_comments enable row level security;

create policy "comments_select" on public.task_comments
  for select to authenticated
  using (public.can_view_task(task_id));

create policy "comments_insert" on public.task_comments
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_comment_task(task_id));

create policy "comments_delete_own" on public.task_comments
  for delete to authenticated
  using (author_id = auth.uid());

-- Nowe komentarze widoczne na żywo
alter publication supabase_realtime add table public.task_comments;
