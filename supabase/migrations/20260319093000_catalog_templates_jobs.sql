create table if not exists public.food_catalog_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  serving_size_text text,
  calories integer not null,
  protein_g numeric(6,2) not null default 0,
  carbs_g numeric(6,2) not null default 0,
  fat_g numeric(6,2) not null default 0,
  source text not null default 'manual',
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_catalog_items_owner_user_id_idx
  on public.food_catalog_items (owner_user_id);

create index if not exists food_catalog_items_name_idx
  on public.food_catalog_items (name);

create table if not exists public.nutrition_entry_food_links (
  id uuid primary key default gen_random_uuid(),
  nutrition_entry_id uuid not null references public.nutrition_entries (id) on delete cascade,
  food_catalog_item_id uuid not null references public.food_catalog_items (id) on delete restrict,
  quantity numeric(8,2) not null default 1,
  unit_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nutrition_entry_id)
);

create index if not exists nutrition_entry_food_links_food_catalog_item_id_idx
  on public.nutrition_entry_food_links (food_catalog_item_id);

create table if not exists public.workout_plan_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plan_templates_owner_user_id_idx
  on public.workout_plan_templates (owner_user_id);

create table if not exists public.workout_plan_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_plan_templates (id) on delete cascade,
  exercise_name text not null,
  sort_order integer not null default 0,
  target_sets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plan_template_exercises_template_id_idx
  on public.workout_plan_template_exercises (template_id);

create table if not exists public.import_export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_type text not null,
  status text not null,
  format text not null,
  resource_type text not null,
  file_name text,
  storage_path text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists import_export_jobs_user_id_idx
  on public.import_export_jobs (user_id);

create index if not exists import_export_jobs_status_idx
  on public.import_export_jobs (status);

drop trigger if exists set_food_catalog_items_updated_at on public.food_catalog_items;
create trigger set_food_catalog_items_updated_at
  before update on public.food_catalog_items
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_nutrition_entry_food_links_updated_at on public.nutrition_entry_food_links;
create trigger set_nutrition_entry_food_links_updated_at
  before update on public.nutrition_entry_food_links
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_workout_plan_templates_updated_at on public.workout_plan_templates;
create trigger set_workout_plan_templates_updated_at
  before update on public.workout_plan_templates
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_workout_plan_template_exercises_updated_at on public.workout_plan_template_exercises;
create trigger set_workout_plan_template_exercises_updated_at
  before update on public.workout_plan_template_exercises
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_import_export_jobs_updated_at on public.import_export_jobs;
create trigger set_import_export_jobs_updated_at
  before update on public.import_export_jobs
  for each row execute procedure public.handle_updated_at();

alter table public.food_catalog_items enable row level security;
alter table public.nutrition_entry_food_links enable row level security;
alter table public.workout_plan_templates enable row level security;
alter table public.workout_plan_template_exercises enable row level security;
alter table public.import_export_jobs enable row level security;

drop policy if exists "food_catalog_items_select_visible" on public.food_catalog_items;
create policy "food_catalog_items_select_visible"
  on public.food_catalog_items for select
  using (owner_user_id is null or owner_user_id = auth.uid());

drop policy if exists "food_catalog_items_manage_own" on public.food_catalog_items;
create policy "food_catalog_items_manage_own"
  on public.food_catalog_items for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "nutrition_entry_food_links_manage_own" on public.nutrition_entry_food_links;
create policy "nutrition_entry_food_links_manage_own"
  on public.nutrition_entry_food_links for all
  using (
    exists (
      select 1
      from public.nutrition_entries ne
      where ne.id = nutrition_entry_id
        and ne.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.nutrition_entries ne
      where ne.id = nutrition_entry_id
        and ne.user_id = auth.uid()
    )
  );

drop policy if exists "workout_plan_templates_select_visible" on public.workout_plan_templates;
create policy "workout_plan_templates_select_visible"
  on public.workout_plan_templates for select
  using (is_public or owner_user_id = auth.uid());

drop policy if exists "workout_plan_templates_manage_own" on public.workout_plan_templates;
create policy "workout_plan_templates_manage_own"
  on public.workout_plan_templates for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "workout_plan_template_exercises_select_visible" on public.workout_plan_template_exercises;
create policy "workout_plan_template_exercises_select_visible"
  on public.workout_plan_template_exercises for select
  using (
    exists (
      select 1
      from public.workout_plan_templates wpt
      where wpt.id = template_id
        and (wpt.is_public or wpt.owner_user_id = auth.uid())
    )
  );

drop policy if exists "workout_plan_template_exercises_manage_own" on public.workout_plan_template_exercises;
create policy "workout_plan_template_exercises_manage_own"
  on public.workout_plan_template_exercises for all
  using (
    exists (
      select 1
      from public.workout_plan_templates wpt
      where wpt.id = template_id
        and wpt.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_plan_templates wpt
      where wpt.id = template_id
        and wpt.owner_user_id = auth.uid()
    )
  );

drop policy if exists "import_export_jobs_manage_own" on public.import_export_jobs;
create policy "import_export_jobs_manage_own"
  on public.import_export_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
