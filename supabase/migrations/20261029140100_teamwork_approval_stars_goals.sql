-- =============================================================
-- Choreo – zadania dla wielu osób, zatwierdzanie, gwiazdki 👏 i cele
-- Uruchom PO pliku 20261029140000_task_status_pending.sql
--
-- Rodzaje zadań (assignment):
--   single   – jedna osoba (assigned_to)
--   anyone   – ktokolwiek z uczestników; kto pierwszy zacznie, ten przejmuje (assigned_to)
--   together – wszyscy razem; jedno wspólne zadanie, nagrodę dostaje każdy uczestnik
-- Zatwierdzanie: dziecko oznacza "zrobione" -> status 'pending' -> rodzic zatwierdza -> 'done'
-- Nagrody: dziecko dostaje ⭐ (star), dorosły 👏 (clap) – zapisywane w point_events
-- =============================================================

-- ---------- Typy ----------
create type public.task_assignment as enum ('single', 'anyone', 'together');
create type public.point_kind as enum ('star', 'clap');

-- ---------- Zadania: rodzaj, kto zrobił, kto zatwierdził ----------
alter table public.tasks
  alter column assigned_to drop not null,
  add column assignment public.task_assignment not null default 'single',
  add column completed_by uuid references public.profiles (id) on delete set null,
  add column approved_by uuid references public.profiles (id) on delete set null;

alter table public.tasks add constraint tasks_assignment_check check (
  (assignment = 'single' and assigned_to is not null)
  or (assignment = 'together' and assigned_to is null)
  or assignment = 'anyone'
);

-- Uczestnicy zadań "ktokolwiek" i "wszyscy razem"
create table public.task_participants (
  task_id uuid not null references public.tasks (id) on delete cascade,
  group_id uuid not null,
  user_id uuid not null,
  primary key (task_id, user_id),
  foreign key (group_id, user_id)
    references public.group_members (group_id, user_id) on delete cascade
);

create index task_participants_user_idx on public.task_participants (user_id);

-- ---------- Szablony cykliczne też mogą być dla wielu osób ----------
alter table public.task_templates
  alter column assigned_to drop not null,
  add column assignment public.task_assignment not null default 'single',
  add column participant_ids uuid[] not null default '{}';

alter table public.task_templates add constraint task_templates_assignment_check check (
  (assignment = 'single' and assigned_to is not null)
  or (assignment <> 'single' and assigned_to is null and cardinality(participant_ids) >= 2)
);

-- ---------- Funkcje pomocnicze ----------
create or replace function public.is_task_participant(tid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.task_participants where task_id = tid and user_id = uid
  );
$$;

-- Dziecko widzi zadania dzieci; zadanie wspólne widzi, jeśli bierze w nim udział dziecko
create or replace function public.can_view_task_row(tid uuid, gid uuid, assignee uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_group_member(gid)
    and (
      public.can_manage_tasks(gid)
      or assignee = auth.uid()
      or public.member_role(gid, assignee) = 'child'
      or exists (
        select 1 from public.task_participants p
        where p.task_id = tid
          and (p.user_id = auth.uid() or public.member_role(gid, p.user_id) = 'child')
      )
    );
$$;

create or replace function public.can_view_task(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = tid and public.can_view_task_row(t.id, t.group_id, t.assigned_to)
  );
$$;

create or replace function public.can_view_template(gid uuid, assignee uuid, participants uuid[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_view_member_tasks(gid, assignee)
    or (
      public.is_group_member(gid)
      and exists (
        select 1 from unnest(participants) u
        where u = auth.uid() or public.member_role(gid, u) = 'child'
      )
    );
$$;

-- Komentarze: także uczestnicy, także przy statusie "czeka na zatwierdzenie"
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
        or (
          (t.assigned_to = auth.uid() or public.is_task_participant(t.id, auth.uid()))
          and t.status in ('in_progress', 'pending', 'done')
        )
      )
  );
$$;

-- ---------- Zasady dostępu do zadań ----------
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select to authenticated
  using (public.can_view_task_row(id, group_id, assigned_to));

drop policy if exists "tasks_update_manager_or_assignee" on public.tasks;
create policy "tasks_update" on public.tasks
  for update to authenticated
  using (
    public.can_manage_tasks(group_id)
    or assigned_to = auth.uid()
    or (assignment = 'together' and public.is_task_participant(id, auth.uid()))
    or (
      assignment = 'anyone' and assigned_to is null
      and public.is_task_participant(id, auth.uid())
    )
  )
  with check (
    public.can_manage_tasks(group_id)
    or assigned_to = auth.uid()
    or (assignment = 'together' and public.is_task_participant(id, auth.uid()))
  );

drop policy if exists "templates_select" on public.task_templates;
create policy "templates_select" on public.task_templates
  for select to authenticated
  using (public.can_view_template(group_id, assigned_to, participant_ids));

alter table public.task_participants enable row level security;

create policy "participants_select" on public.task_participants
  for select to authenticated
  using (public.can_view_task(task_id));
-- dodawanie i usuwanie uczestników tylko przez funkcję save_group_task

-- ---------- Logika statusu ----------
create or replace function public.before_task_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  is_manager boolean := actor is null or public.can_manage_tasks(old.group_id);
begin
  new.updated_at := now();

  if not is_manager then
    -- dziecko może zmieniać tylko status
    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.due_date is distinct from old.due_date
      or new.assigned_to is distinct from old.assigned_to
      or new.group_id is distinct from old.group_id
      or new.created_by is distinct from old.created_by
      or new.template_id is distinct from old.template_id
      or new.assignment is distinct from old.assignment
      or new.approved_by is distinct from old.approved_by then
      raise exception 'Możesz zmienić tylko status swojego zadania.';
    end if;

    if old.status = 'done' then
      raise exception 'To zadanie zostało już zatwierdzone przez rodzica.';
    end if;

    -- zrobione przez dziecko czeka na zatwierdzenie rodzica
    if new.status = 'done' then
      new.status := 'pending';
    end if;
  end if;

  -- "ktokolwiek": kto pierwszy zacznie, ten przejmuje zadanie; powrót do "do zrobienia" je zwalnia
  if old.assignment = 'anyone' then
    if new.status = 'todo' and old.status <> 'todo' then
      new.assigned_to := null;
    elsif old.assigned_to is null and new.status <> 'todo' and actor is not null
      and public.is_task_participant(old.id, actor) then
      new.assigned_to := actor;
    end if;
  end if;

  -- kto zrobił
  if new.status in ('pending', 'done') and old.status not in ('pending', 'done') then
    new.completed_by := coalesce(actor, old.completed_by);
  elsif new.status in ('todo', 'in_progress') then
    new.completed_by := null;
  end if;

  -- kiedy zrobione i kto zatwierdził
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := now();
    new.approved_by := case when old.status = 'pending' then actor else null end;
  elsif new.status <> 'done' then
    new.completed_at := null;
    new.approved_by := null;
  end if;

  return new;
end;
$$;

-- ---------- Gwiazdki i klepnięcia ----------
create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null,
  task_id uuid references public.tasks (id) on delete set null,
  goal_id uuid,
  kind public.point_kind not null,
  amount integer not null,
  reason text not null check (reason in ('task', 'reward')),
  created_at timestamptz not null default now(),
  foreign key (group_id, user_id)
    references public.group_members (group_id, user_id) on delete cascade
);

-- jedna nagroda za zadanie dla danej osoby
create unique index point_events_task_award on public.point_events (task_id, user_id)
  where reason = 'task';
create index point_events_member_idx on public.point_events (group_id, user_id);

alter table public.point_events enable row level security;

create policy "points_select" on public.point_events
  for select to authenticated
  using (public.can_view_member_tasks(group_id, user_id));
-- zapis tylko przez triggery i funkcję redeem_goal

create or replace function public.after_task_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    -- ⭐ dla dzieci, 👏 dla dorosłych
    insert into public.point_events (group_id, user_id, task_id, kind, amount, reason)
    select new.group_id,
      r.user_id,
      new.id,
      (case when public.member_role(new.group_id, r.user_id) = 'child' then 'star' else 'clap' end)::public.point_kind,
      1,
      'task'
    from (
      select new.assigned_to as user_id
      where new.assignment in ('single', 'anyone') and new.assigned_to is not null
      union
      select p.user_id from public.task_participants p
      where p.task_id = new.id and new.assignment = 'together'
    ) r
    where exists (
      select 1 from public.group_members m
      where m.group_id = new.group_id and m.user_id = r.user_id
    )
    on conflict do nothing;
  elsif old.status = 'done' and new.status <> 'done' then
    -- rodzic cofnął zatwierdzenie – nagroda też znika
    delete from public.point_events where task_id = new.id and reason = 'task';
  end if;
  return new;
end;
$$;

create trigger tasks_after_status_change
  after update of status on public.tasks
  for each row execute function public.after_task_status_change();

-- Saldo ⭐ i 👏 członków grupy (tylko tych, których zadania widzi zalogowany)
create or replace function public.point_balances(gid uuid)
returns table (user_id uuid, stars integer, claps integer)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id,
    coalesce(sum(e.amount) filter (where e.kind = 'star'), 0)::integer as stars,
    coalesce(sum(e.amount) filter (where e.kind = 'clap'), 0)::integer as claps
  from public.group_members m
  left join public.point_events e on e.group_id = m.group_id and e.user_id = m.user_id
  where m.group_id = gid and public.can_view_member_tasks(gid, m.user_id)
  group by m.user_id;
$$;

revoke execute on function public.point_balances(uuid) from public, anon;
grant execute on function public.point_balances(uuid) to authenticated;

-- ---------- Cele (dziecko ustala, rodzic wręcza nagrodę) ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(trim(title)) between 1 and 60),
  emoji text not null default '🎁' check (char_length(emoji) <= 8),
  stars_needed integer not null check (stars_needed between 1 and 1000),
  status text not null default 'active' check (status in ('active', 'redeemed')),
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (group_id, user_id)
    references public.group_members (group_id, user_id) on delete cascade
);

create index goals_member_idx on public.goals (group_id, user_id);

alter table public.point_events
  add constraint point_events_goal_fk foreign key (goal_id)
  references public.goals (id) on delete set null;

alter table public.goals enable row level security;

create policy "goals_select" on public.goals
  for select to authenticated
  using (public.can_view_member_tasks(group_id, user_id));

create policy "goals_insert_own" on public.goals
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id) and status = 'active');

create policy "goals_update_own_active" on public.goals
  for update to authenticated
  using (user_id = auth.uid() and status = 'active')
  with check (user_id = auth.uid() and status = 'active');

create policy "goals_delete_own_or_manager" on public.goals
  for delete to authenticated
  using (user_id = auth.uid() or public.can_manage_tasks(group_id));

create or replace function public.before_goal_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('choreo.internal', true), '') <> 'on'
    and (
      new.group_id is distinct from old.group_id
      or new.user_id is distinct from old.user_id
      or new.redeemed_at is distinct from old.redeemed_at
      or new.redeemed_by is distinct from old.redeemed_by
    ) then
    raise exception 'Nagrodę może wręczyć tylko rodzic.';
  end if;
  return new;
end;
$$;

create trigger goals_before_update
  before update on public.goals
  for each row execute function public.before_goal_update();

-- Rodzic wręcza nagrodę: gwiazdki z celu odejmują się od salda
create or replace function public.redeem_goal(p_goal_id uuid)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.goals;
  balance integer;
begin
  select * into g from public.goals where id = p_goal_id for update;
  if not found then
    raise exception 'Nie znaleziono celu.';
  end if;
  if not public.can_manage_tasks(g.group_id) then
    raise exception 'Tylko rodzic może wręczyć nagrodę.';
  end if;
  if g.status <> 'active' then
    raise exception 'Ta nagroda została już wręczona.';
  end if;

  select coalesce(sum(amount), 0) into balance
  from public.point_events
  where group_id = g.group_id and user_id = g.user_id and kind = 'star';

  if balance < g.stars_needed then
    raise exception 'Za mało gwiazdek: % z %.', balance, g.stars_needed;
  end if;

  insert into public.point_events (group_id, user_id, goal_id, kind, amount, reason)
  values (g.group_id, g.user_id, g.id, 'star', -g.stars_needed, 'reward');

  perform set_config('choreo.internal', 'on', true);
  update public.goals
  set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid()
  where id = g.id
  returning * into g;
  perform set_config('choreo.internal', 'off', true);

  return g;
end;
$$;

revoke execute on function public.redeem_goal(uuid) from public, anon;
grant execute on function public.redeem_goal(uuid) to authenticated;

-- ---------- Tworzenie i edycja zadań dla jednej lub wielu osób ----------
create or replace function public.save_group_task(
  p_group_id uuid,
  p_task_id uuid,
  p_title text,
  p_description text,
  p_due_date date,
  p_assignment public.task_assignment,
  p_assignee_ids uuid[]
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids uuid[] := array(select distinct unnest(p_assignee_ids));
  saved public.tasks;
begin
  if not public.can_manage_tasks(p_group_id) then
    raise exception 'Tylko zarządca i dorośli mogą dodawać zadania.';
  end if;

  if coalesce(cardinality(ids), 0) = 0 then
    raise exception 'Wybierz, dla kogo jest zadanie.';
  end if;
  if p_assignment = 'single' and cardinality(ids) <> 1 then
    raise exception 'Zadanie dla jednej osoby może mieć tylko jedną osobę.';
  end if;
  if p_assignment <> 'single' and cardinality(ids) < 2 then
    raise exception 'Wybierz co najmniej dwie osoby.';
  end if;
  if (
    select count(*) from public.group_members
    where group_id = p_group_id and user_id = any (ids)
  ) <> cardinality(ids) then
    raise exception 'Wszystkie osoby muszą należeć do grupy.';
  end if;

  if p_task_id is null then
    insert into public.tasks
      (group_id, assigned_to, created_by, title, description, due_date, assignment)
    values (
      p_group_id,
      case when p_assignment = 'single' then ids[1] end,
      auth.uid(),
      trim(p_title),
      nullif(trim(p_description), ''),
      p_due_date,
      p_assignment
    )
    returning * into saved;
  else
    update public.tasks
    set title = trim(p_title),
      description = nullif(trim(p_description), ''),
      due_date = p_due_date,
      assignment = p_assignment,
      assigned_to = case
        when p_assignment = 'single' then ids[1]
        -- "ktokolwiek": zostawiamy osobę, która już przejęła zadanie, jeśli nadal jest na liście
        when p_assignment = 'anyone' and assigned_to = any (ids) then assigned_to
      end
    where id = p_task_id and group_id = p_group_id
    returning * into saved;

    if not found then
      raise exception 'Nie znaleziono zadania.';
    end if;

    delete from public.task_participants where task_id = saved.id;
  end if;

  if p_assignment <> 'single' then
    insert into public.task_participants (task_id, group_id, user_id)
    select saved.id, p_group_id, u from unnest(ids) u;
  end if;

  return saved;
end;
$$;

revoke execute on function
  public.save_group_task(uuid, uuid, text, text, date, public.task_assignment, uuid[])
  from public, anon;
grant execute on function
  public.save_group_task(uuid, uuid, text, text, date, public.task_assignment, uuid[])
  to authenticated;

-- ---------- Zadania cykliczne: obsługa wielu osób ----------
create or replace function public.ensure_tasks_for_day(gid uuid, day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.task_templates;
  new_id uuid;
  members uuid[];
begin
  if not public.is_group_member(gid) then
    raise exception 'Nie masz dostępu do tej grupy.';
  end if;

  if day < current_date - 31 or day > current_date + 366 then
    return;
  end if;

  for t in
    select tt.* from public.task_templates tt
    where tt.group_id = gid
      and tt.is_active
      and day >= tt.start_date
      and (tt.end_date is null or day <= tt.end_date)
      and extract(isodow from day)::smallint = any (tt.weekdays)
      and not exists (
        select 1 from public.task_template_skips s
        where s.template_id = tt.id and s.skip_date = day
      )
      and not exists (
        select 1 from public.tasks x where x.template_id = tt.id and x.due_date = day
      )
  loop
    new_id := null;

    if t.assignment = 'single' then
      insert into public.tasks
        (group_id, assigned_to, created_by, title, description, due_date, template_id)
      values (t.group_id, t.assigned_to, t.created_by, t.title, t.description, day, t.id)
      on conflict (template_id, due_date) where template_id is not null do nothing;
    else
      -- tylko osoby, które nadal są w grupie
      select array_agg(u) into members
      from unnest(t.participant_ids) u
      where exists (
        select 1 from public.group_members m where m.group_id = t.group_id and m.user_id = u
      );

      if coalesce(cardinality(members), 0) = 0 then
        continue;
      end if;

      insert into public.tasks
        (group_id, assigned_to, created_by, title, description, due_date, template_id, assignment)
      values (t.group_id, null, t.created_by, t.title, t.description, day, t.id, t.assignment)
      on conflict (template_id, due_date) where template_id is not null do nothing
      returning id into new_id;

      if new_id is not null then
        insert into public.task_participants (task_id, group_id, user_id)
        select new_id, t.group_id, u from unnest(members) u;
      end if;
    end if;
  end loop;
end;
$$;

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.point_events;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.task_participants;
