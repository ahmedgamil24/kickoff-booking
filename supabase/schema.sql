create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('scheduled', 'open', 'closed', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type public.registration_status as enum ('confirmed', 'waitlisted', 'cancelled');
  end if;
end $$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  created_at timestamptz not null default now(),
  constraint players_full_name_nonempty check (length(trim(full_name)) > 0),
  constraint players_phone_nonempty check (length(trim(phone)) > 0)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  match_date date not null unique,
  max_players integer not null default 12,
  status booking_status not null default 'scheduled',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint bookings_max_players check (max_players > 0),
  constraint bookings_time_window check (closes_at > opens_at)
);

create table if not exists public.booking_registrations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status registration_status not null default 'confirmed',
  cancellation_token_hash text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (booking_id, player_id),
  constraint registrations_status_valid check (status in ('confirmed', 'waitlisted', 'cancelled'))
);

create index if not exists idx_bookings_match_date on public.bookings(match_date);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_booking_registrations_booking_status on public.booking_registrations(booking_id, status);
create index if not exists idx_booking_registrations_player on public.booking_registrations(player_id);

alter table public.players enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_registrations enable row level security;

drop policy if exists "public_view_booking_summaries" on public.bookings;
drop policy if exists "public_block_booking_modifications" on public.bookings;
drop policy if exists "public_block_player_queries" on public.players;
drop policy if exists "public_block_player_modifications" on public.players;
drop policy if exists "public_block_registration_queries" on public.booking_registrations;
drop policy if exists "public_block_registration_modifications" on public.booking_registrations;
drop policy if exists "admin_view_bookings" on public.bookings;
drop policy if exists "admin_view_registrations" on public.booking_registrations;

create policy "public_view_booking_summaries"
on public.bookings
for select
using (true);

create policy "public_block_booking_modifications"
on public.bookings
for all
using (false)
with check (false);

create policy "public_block_player_queries"
on public.players
for select
using (false);

create policy "public_block_player_modifications"
on public.players
for all
using (false)
with check (false);

create policy "public_block_registration_queries"
on public.booking_registrations
for select
using (false);

create policy "public_block_registration_modifications"
on public.booking_registrations
for all
using (false)
with check (false);

create policy "admin_view_bookings"
on public.bookings
for select
using (public.is_admin());

create policy "admin_view_registrations"
on public.booking_registrations
for select
using (public.is_admin());

create or replace function public.get_upcoming_match_date()
returns date
language sql
stable
set search_path = public
as $$
  with current_local as (
    select (timezone('Africa/Cairo', now()))::date as local_date
  )
  select local_date + 1
  from current_local;
$$;

create or replace function public.get_public_booking_details()
returns table (
  id uuid,
  match_date date,
  max_players integer,
  status booking_status,
  confirmed_count bigint,
  waiting_count bigint
)
language sql
security definer
set search_path = public
as $$
  with next_booking as (
    select b.*
    from public.bookings b
    where b.match_date = public.get_upcoming_match_date()
    limit 1
  )
  select
    nb.id,
    nb.match_date,
    nb.max_players,
    nb.status,
    (
      select count(*)
      from public.booking_registrations br
      where br.booking_id = nb.id and br.status = 'confirmed'
    ) as confirmed_count,
    (
      select count(*)
      from public.booking_registrations br
      where br.booking_id = nb.id and br.status = 'waitlisted'
    ) as waiting_count
  from next_booking nb;
$$;

create or replace function public.get_admin_bookings()
returns table (
  id uuid,
  match_date date,
  status booking_status,
  max_players integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select b.id, b.match_date, b.status, b.max_players
  from public.bookings b
  order by b.match_date desc;
end;
$$;

create or replace function public.get_admin_dashboard_stats()
returns table (
  total_bookings bigint,
  upcoming_bookings bigint,
  confirmed_players bigint,
  waiting_players bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    (select count(*) from public.bookings)::bigint as total_bookings,
    (select count(*) from public.bookings where status <> 'completed' and status <> 'cancelled')::bigint as upcoming_bookings,
    (select count(*) from public.booking_registrations where status = 'confirmed')::bigint as confirmed_players,
    (select count(*) from public.booking_registrations where status = 'waitlisted')::bigint as waiting_players;
end;
$$;

create or replace function public.register_player(full_name text, phone_number text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text;
  booking_row public.bookings%rowtype;
  player_row public.players%rowtype;
  inserted_registration public.booking_registrations%rowtype;
  current_confirmed_count integer;
  registration_status registration_status;
begin
  normalized_phone := trim(regexp_replace(phone_number, '\s+', '', 'g'));

  if length(trim(full_name)) < 2 then
    raise exception 'Full name is required';
  end if;

  if length(normalized_phone) < 7 then
    raise exception 'Phone number is invalid';
  end if;

  select * into booking_row
  from public.bookings
  where match_date = public.get_upcoming_match_date()
  limit 1;

  if booking_row.id is null then
    raise exception 'No active booking found';
  end if;

  select * into player_row
  from public.players
  where phone = normalized_phone
  limit 1;

  if player_row.id is null then
    insert into public.players (full_name, phone)
    values (trim(full_name), normalized_phone)
    returning * into player_row;
  end if;

  if exists (
    select 1
    from public.booking_registrations br
    where br.booking_id = booking_row.id and br.player_id = player_row.id and br.status <> 'cancelled'
  ) then
    raise exception 'Player already registered for this booking';
  end if;

  select count(*) into current_confirmed_count
  from public.booking_registrations
  where booking_id = booking_row.id and status = 'confirmed';

  if current_confirmed_count < booking_row.max_players then
    registration_status := 'confirmed';
  else
    registration_status := 'waitlisted';
  end if;

  insert into public.booking_registrations (booking_id, player_id, status, cancellation_token_hash)
  values (
    booking_row.id,
    player_row.id,
    registration_status,
    encode(digest(convert_to(gen_random_uuid()::text, 'UTF8'), 'sha256'::text), 'hex')
  )
  returning * into inserted_registration;

  return json_build_object(
    'registration_id', inserted_registration.id,
    'booking_id', inserted_registration.booking_id,
    'player_id', inserted_registration.player_id,
    'status', inserted_registration.status,
    'cancellation_token', inserted_registration.cancellation_token_hash
  );
end;
$$;

create or replace function public.cancel_registration(registration_id uuid, cancellation_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row_record public.booking_registrations%rowtype;
begin
  select * into row_record
  from public.booking_registrations
  where id = registration_id
  limit 1;

  if row_record.id is null then
    raise exception 'Registration not found';
  end if;

  if row_record.cancellation_token_hash is null then
    raise exception 'Cancellation token is invalid';
  end if;

  if row_record.cancellation_token_hash <> encode(digest(convert_to(cancellation_token, 'UTF8'), 'sha256'::text), 'hex') then
    raise exception 'Cancellation token is invalid';
  end if;

  update public.booking_registrations
  set status = 'cancelled', cancelled_at = now()
  where id = registration_id;

  return true;
end;
$$;

create or replace function public.create_weekly_booking(p_match_date date)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings%rowtype;
  start_ts timestamptz;
  end_ts timestamptz;
begin
  select * into booking_row
  from public.bookings
  where match_date = p_match_date;

  if booking_row.id is not null then
    return booking_row;
  end if;

  start_ts := make_timestamptz(
    extract(year from p_match_date)::int,
    extract(month from p_match_date)::int,
    extract(day from p_match_date)::int,
    0,
    0,
    0,
    'Africa/Cairo'
  );

  end_ts := make_timestamptz(
    extract(year from p_match_date)::int,
    extract(month from p_match_date)::int,
    extract(day from p_match_date)::int,
    23,
    0,
    0,
    'Africa/Cairo'
  );

  insert into public.bookings (match_date, max_players, status, opens_at, closes_at)
  values (p_match_date, 12, 'scheduled', start_ts, end_ts)
  returning * into booking_row;

  return booking_row;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.uid() is not null and auth.jwt() ->> 'role' = 'authenticated', false);
$$;