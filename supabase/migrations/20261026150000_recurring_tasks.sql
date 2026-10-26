-- =============================================================
-- Choreo – zadania cykliczne
-- Szablon (task_templates) opisuje, co i w które dni tygodnia się powtarza.
-- Zadania na konkretny dzień tworzy funkcja ensure_tasks_for_day,
-- wywoływana przez aplikację przy otwieraniu dnia ("na żądanie").
-- =============================================================

-- ---------- Szablony ----------
create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  assigned_to uuid not null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  -- dni tygodnia ISO: 1 = poniedziałek ... 7 = niedziela
  weekdays smallint[] not null check (
    cardinality(weekdays) between 1 and 7
    and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  ),
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  foreign key (group_id, assigned_to)
    references public.group_members (group_id, user_id) on delete cascade
);

create index task_templates_group_idx on public.task_templates (group_id);

-- Dni, w które zadanie z serii zostało celowo usunięte – nie tworzymy go ponownie
create table public.task_template_skips (
  template_id uuid not null references public.task_templates (id) on delete cascade,
  skip_date date not null,
  primary key (template_id, skip_date)
);

-- ---------- Powiązanie zadań z szablonem ----------
alter table public.tasks
  add column template_id uuid references public.task_templates (id) on delete set null;

-- Najwyżej jedno zadanie z danego szablonu na dany dzień
create unique index tasks_template_day_unique on public.tasks (template_id, due_date)
  where template_id is not null;

-- ---------- Dziecko nadal może zmieniać tylko status ----------
create or replace function public.before_task_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is null = zmiana z panelu Supabase / serwera, bez ograniczeń
  if auth.uid() is not null and not public.can_manage_tasks(old.group_id) then
    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.due_date is distinct from old.due_date
      or new.assigned_to is distinct from old.assigned_to
      or new.group_id is distinct from old.group_id
      or new.created_by is distinct from old.created_by
      or new.template_id is distinct from old.template_id then
      raise exception 'Możesz zmienić tylko status swojego zadania.';
    end if;
  end if;

  new.updated_at := now();

  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

-- ---------- Usunięcie zadania z serii = wyjątek na ten dzień ----------
create or replace function public.after_task_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 'choreo.internal' = usuwanie przez sam system (zmiana szablonu), nie przez użytkownika
  if old.template_id is not null
    and coalesce(current_setting('choreo.internal', true), '') <> 'on' then
    insert into public.task_template_skips (template_id, skip_date)
    select old.template_id, old.due_date
    -- szablon mógł zostać właśnie usunięty kaskadowo (np. usunięcie członka)
    where exists (select 1 from public.task_templates where id = old.template_id)
    on conflict do nothing;
  end if;
  return old;
end;
$$;

create trigger tasks_after_delete
  after delete on public.tasks
  for each row execute function public.after_task_delete();

-- ---------- Zmiana szablonu odświeża przyszłe, nierozpoczęte zadania ----------
create or replace function public.clear_upcoming_template_tasks(tid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('choreo.internal', 'on', true);
  delete from public.tasks
  where template_id = tid
    and due_date >= current_date
    and status = 'todo';
  perform set_config('choreo.internal', 'off', true);
end;
$$;

revoke execute on function public.clear_upcoming_template_tasks(uuid) from public, anon, authenticated;

create or replace function public.before_template_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.group_id is distinct from old.group_id then
    raise exception 'Nie można przenieść szablonu do innej grupy.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger task_templates_before_update
  before update on public.task_templates
  for each row execute function public.before_template_update();

create or replace function public.after_template_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- usuwamy przyszłe nierozpoczęte zadania; utworzą się na nowo wg nowych ustawień
  perform public.clear_upcoming_template_tasks(new.id);
  return new;
end;
$$;

create trigger task_templates_after_update
  after update on public.task_templates
  for each row execute function public.after_template_update();

create or replace function public.before_template_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.clear_upcoming_template_tasks(old.id);
  return old;
end;
$$;

create trigger task_templates_before_delete
  before delete on public.task_templates
  for each row execute function public.before_template_delete();

-- ---------- Tworzenie zadań na dany dzień ----------
create or replace function public.ensure_tasks_for_day(gid uuid, day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_group_member(gid) then
    raise exception 'Nie masz dostępu do tej grupy.';
  end if;

  -- ochrona przed tworzeniem zadań na lata do przodu lub wstecz
  if day < current_date - 31 or day > current_date + 366 then
    return;
  end if;

  insert into public.tasks
    (group_id, assigned_to, created_by, title, description, due_date, template_id)
  select t.group_id, t.assigned_to, t.created_by, t.title, t.description, day, t.id
  from public.task_templates t
  where t.group_id = gid
    and t.is_active
    and day >= t.start_date
    and (t.end_date is null or day <= t.end_date)
    and extract(isodow from day)::smallint = any (t.weekdays)
    and not exists (
      select 1 from public.task_template_skips s
      where s.template_id = t.id and s.skip_date = day
    )
  on conflict (template_id, due_date) where template_id is not null do nothing;
end;
$$;

revoke execute on function public.ensure_tasks_for_day(uuid, date) from public, anon;
grant execute on function public.ensure_tasks_for_day(uuid, date) to authenticated;

-- ---------- Row Level Security ----------
alter table public.task_templates enable row level security;
alter table public.task_template_skips enable row level security;
-- task_template_skips: brak zasad = brak bezpośredniego dostępu, obsługują go tylko triggery

create policy "templates_select" on public.task_templates
  for select to authenticated
  using (public.is_group_member(group_id));

create policy "templates_insert_manager" on public.task_templates
  for insert to authenticated
  with check (public.can_manage_tasks(group_id) and created_by = auth.uid());

create policy "templates_update_manager" on public.task_templates
  for update to authenticated
  using (public.can_manage_tasks(group_id))
  with check (public.can_manage_tasks(group_id));

create policy "templates_delete_manager" on public.task_templates
  for delete to authenticated
  using (public.can_manage_tasks(group_id));
