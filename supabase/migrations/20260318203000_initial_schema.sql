create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  height_cm numeric(5,2),
  start_weight_kg numeric(5,2),
  goal_weight_kg numeric(5,2),
  daily_calorie_goal integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(5,2) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  meal_type text not null,
  item_name text not null,
  calories integer not null,
  protein_g numeric(6,2) not null default 0,
  carbs_g numeric(6,2) not null default 0,
  fat_g numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  title text not null,
  duration_minutes integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_name text not null,
  sort_order integer not null default 0,
  sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  waist_cm numeric(5,2),
  hips_cm numeric(5,2),
  chest_cm numeric(5,2),
  arm_cm numeric(5,2),
  thigh_cm numeric(5,2),
  neck_cm numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_weight_entries_updated_at on public.weight_entries;
create trigger set_weight_entries_updated_at
  before update on public.weight_entries
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_nutrition_entries_updated_at on public.nutrition_entries;
create trigger set_nutrition_entries_updated_at
  before update on public.nutrition_entries
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_workout_exercises_updated_at on public.workout_exercises;
create trigger set_workout_exercises_updated_at
  before update on public.workout_exercises
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_body_measurements_updated_at on public.body_measurements;
create trigger set_body_measurements_updated_at
  before update on public.body_measurements
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.nutrition_entries enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.body_measurements enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "weight_entries_manage_own"
  on public.weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nutrition_entries_manage_own"
  on public.nutrition_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_sessions_manage_own"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_exercises_manage_own"
  on public.workout_exercises for all
  using (
    exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
    )
  );

create policy "body_measurements_manage_own"
  on public.body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
