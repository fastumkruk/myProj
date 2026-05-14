create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lists_household_id_idx on lists(household_id);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  title text not null,
  is_checked boolean not null default false,
  position int not null default 0,
  price numeric,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_list_id_idx on items(list_id);

alter table items add column if not exists price numeric;

alter table households enable row level security;
alter table household_members enable row level security;
alter table lists enable row level security;
alter table items enable row level security;

create policy households_select_member on households
  for select
  to authenticated
  using (
    exists (
      select 1
      from household_members hm
      where hm.household_id = households.id
        and hm.user_id = auth.uid()
    )
  );

create policy household_members_select_self on household_members
  for select
  to authenticated
  using (user_id = auth.uid());

create policy household_members_insert_self on household_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy lists_all_member on lists
  for all
  to authenticated
  using (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lists.household_id
        and hm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lists.household_id
        and hm.user_id = auth.uid()
    )
  );

create policy items_all_member on items
  for all
  to authenticated
  using (
    exists (
      select 1
      from lists l
      join household_members hm on hm.household_id = l.household_id
      where l.id = items.list_id
        and hm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from lists l
      join household_members hm on hm.household_id = l.household_id
      where l.id = items.list_id
        and hm.user_id = auth.uid()
    )
  );

create or replace function create_household(p_name text)
returns table (household_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_invite_code text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  loop
    v_invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from households h where h.invite_code = v_invite_code);
  end loop;

  insert into households (name, invite_code, created_by)
  values (p_name, v_invite_code, auth.uid())
  returning id into v_household_id;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'owner')
  on conflict do nothing;

  household_id := v_household_id;
  invite_code := v_invite_code;
  return next;
end;
$$;

create or replace function join_household(p_invite_code text)
returns table (household_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select h.id into v_household_id
  from households h
  where h.invite_code = upper(trim(p_invite_code))
  limit 1;

  if v_household_id is null then
    raise exception 'invalid_invite_code';
  end if;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'member')
  on conflict do nothing;

  household_id := v_household_id;
  return next;
end;
$$;
