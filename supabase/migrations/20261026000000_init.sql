-- =============================================================
-- Choreo – schemat bazy danych (Etap 3)
-- Tabele: profiles, groups, group_members, group_invites, tasks
-- Role: owner (zarządca), adult (pełnoprawny), child (dziecko)
-- Uprawnienia: Row Level Security
-- =============================================================

-- ---------- Typy ----------
create type public.group_role as enum ('owner', 'adult', 'child');
create type public.task_status as enum ('todo', 'in_progress', 'done');

-- ---------- Tabele ----------

-- Profil użytkownika (1:1 z auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Grupa (np. rodzina)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Członkostwo w grupie z rolą
create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null default 'child',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Jednorazowe zaproszenie z rolą, ważne 7 dni
create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  role public.group_role not null check (role <> 'owner'),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Zadanie przypisane do członka grupy na konkretny dzień
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  assigned_to uuid not null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  due_date date not null default current_date,
  status public.task_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- osoba z zadaniem musi być członkiem tej samej grupy
  foreign key (group_id, assigned_to)
    references public.group_members (group_id, user_id) on delete cascade
);

-- W każdej grupie dokładnie jeden zarządca
create unique index one_owner_per_group on public.group_members (group_id)
  where role = 'owner';

create index tasks_group_date_idx on public.tasks (group_id, due_date);
create index tasks_assignee_date_idx on public.tasks (assigned_to, due_date);
create index group_members_user_idx on public.group_members (user_id);
create index group_invites_group_idx on public.group_invites (group_id);

-- ---------- Funkcje pomocnicze (security definer = bez rekurencji w RLS) ----------

-- Rola zalogowanego użytkownika w grupie (null = nie jest członkiem)
create or replace function public.my_role(gid uuid)
returns public.group_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.group_members
  where group_id = gid and user_id = auth.uid();
$$;

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.my_role(gid) is not null;
$$;

-- Zarządca i dorośli mogą zarządzać zadaniami
create or replace function public.can_manage_tasks(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role(gid) in ('owner', 'adult'), false);
$$;

-- Tylko zarządca zarządza członkami, zaproszeniami i grupą
create or replace function public.is_group_owner(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role(gid) = 'owner', false);
$$;

create or replace function public.shares_group_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = other_user
  );
$$;

-- ---------- Automatyczny profil po rejestracji ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Ochrona zadań: dziecko może zmienić tylko status ----------

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
      or new.created_by is distinct from old.created_by then
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

create trigger tasks_before_update
  before update on public.tasks
  for each row execute function public.before_task_update();

-- ---------- RPC: utworzenie grupy i dołączenie przez zaproszenie ----------

-- Tworzy grupę i dodaje twórcę jako zarządcę (owner)
create or replace function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowana/y.';
  end if;

  insert into public.groups (name, created_by)
  values (group_name, auth.uid())
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

-- Dołącza do grupy z rolą zapisaną w zaproszeniu i zużywa zaproszenie
create or replace function public.join_group(invite_code text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.group_invites;
  found_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowana/y.';
  end if;

  select * into inv
  from public.group_invites
  where code = upper(trim(invite_code))
  for update;

  if not found or inv.used_at is not null or inv.expires_at < now() then
    raise exception 'Kod zaproszenia jest nieprawidłowy, wygasł albo został już użyty.';
  end if;

  select * into found_group from public.groups where id = inv.group_id;

  -- już jest członkiem: nie zużywamy zaproszenia
  if exists (
    select 1 from public.group_members
    where group_id = inv.group_id and user_id = auth.uid()
  ) then
    return found_group;
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (inv.group_id, auth.uid(), inv.role);

  update public.group_invites
  set used_by = auth.uid(), used_at = now()
  where id = inv.id;

  return found_group;
end;
$$;

revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.tasks enable row level security;

-- profiles: widzę siebie i osoby z moich grup, edytuję tylko siebie
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- groups: widzą członkowie, zmienia i usuwa zarządca
-- (tworzenie tylko przez funkcję create_group)
create policy "groups_select" on public.groups
  for select to authenticated
  using (public.is_group_member(id));

create policy "groups_update_owner" on public.groups
  for update to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

create policy "groups_delete_owner" on public.groups
  for delete to authenticated
  using (public.is_group_owner(id));

-- group_members: widzą członkowie grupy;
-- zarządca zmienia role (adult <-> child) i usuwa członków;
-- każdy oprócz zarządcy może sam opuścić grupę
-- (dołączanie tylko przez funkcję join_group)
create policy "members_select" on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

create policy "members_update_owner" on public.group_members
  for update to authenticated
  using (public.is_group_owner(group_id) and role <> 'owner')
  with check (public.is_group_owner(group_id) and role <> 'owner');

create policy "members_delete" on public.group_members
  for delete to authenticated
  using (role <> 'owner' and (public.is_group_owner(group_id) or user_id = auth.uid()));

-- group_invites: tylko zarządca tworzy, widzi i usuwa zaproszenia
create policy "invites_select_owner" on public.group_invites
  for select to authenticated
  using (public.is_group_owner(group_id));

create policy "invites_insert_owner" on public.group_invites
  for insert to authenticated
  with check (public.is_group_owner(group_id) and created_by = auth.uid());

create policy "invites_delete_owner" on public.group_invites
  for delete to authenticated
  using (public.is_group_owner(group_id));

-- tasks: widzą wszyscy członkowie grupy;
-- tworzą, edytują i usuwają zarządca i dorośli;
-- dziecko zmienia tylko status swoich zadań (patrz trigger)
create policy "tasks_select" on public.tasks
  for select to authenticated
  using (public.is_group_member(group_id));

create policy "tasks_insert_manager" on public.tasks
  for insert to authenticated
  with check (public.can_manage_tasks(group_id) and created_by = auth.uid());

create policy "tasks_update_manager_or_assignee" on public.tasks
  for update to authenticated
  using (public.can_manage_tasks(group_id) or assigned_to = auth.uid())
  with check (public.can_manage_tasks(group_id) or assigned_to = auth.uid());

create policy "tasks_delete_manager" on public.tasks
  for delete to authenticated
  using (public.can_manage_tasks(group_id));

-- ---------- Realtime: zmiany zadań na żywo ----------
alter publication supabase_realtime add table public.tasks;
