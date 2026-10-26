-- =============================================================
-- Choreo – etykiety członków grupy
-- Etykieta (np. "Mama", "Tata", "Babcia", "Kolega") to dowolna nazwa
-- wyświetlana w grupie. Nie wpływa na uprawnienia – o nich decyduje rola.
-- =============================================================

-- ---------- Nowe kolumny ----------
alter table public.group_members
  add column label text check (char_length(label) between 1 and 30);

alter table public.group_invites
  add column label text check (char_length(label) between 1 and 30);

-- ---------- Kto może zmieniać członkostwo ----------
-- Zarządca: etykiety wszystkich (także swoją) i role (adult <-> child).
-- Członek: tylko swoją etykietę.
drop policy if exists "members_update_owner" on public.group_members;

create policy "members_update_owner_or_self" on public.group_members
  for update to authenticated
  using (public.is_group_owner(group_id) or user_id = auth.uid())
  with check (public.is_group_owner(group_id) or user_id = auth.uid());

create or replace function public.before_member_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is null = zmiana z panelu Supabase / serwera, bez ograniczeń
  if auth.uid() is null then
    return new;
  end if;

  if new.group_id is distinct from old.group_id
    or new.user_id is distinct from old.user_id
    or new.joined_at is distinct from old.joined_at then
    raise exception 'Nie można zmienić grupy ani użytkownika.';
  end if;

  if new.role is distinct from old.role then
    if not public.is_group_owner(old.group_id) then
      raise exception 'Tylko zarządca może zmieniać role.';
    end if;
    if old.role = 'owner' or new.role = 'owner' then
      raise exception 'Nie można zmienić roli zarządcy.';
    end if;
  end if;

  return new;
end;
$$;

create trigger group_members_before_update
  before update on public.group_members
  for each row execute function public.before_member_update();

-- ---------- Dołączanie: etykieta z zaproszenia ----------
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

  insert into public.group_members (group_id, user_id, role, label)
  values (inv.group_id, auth.uid(), inv.role, inv.label);

  update public.group_invites
  set used_by = auth.uid(), used_at = now()
  where id = inv.id;

  return found_group;
end;
$$;

-- ---------- Tworzenie grupy: opcjonalna etykieta zarządcy ----------
drop function if exists public.create_group(text);

create or replace function public.create_group(group_name text, my_label text default null)
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

  insert into public.group_members (group_id, user_id, role, label)
  values (new_group.id, auth.uid(), 'owner', nullif(trim(my_label), ''));

  return new_group;
end;
$$;

revoke execute on function public.create_group(text, text) from public, anon;
grant execute on function public.create_group(text, text) to authenticated;
