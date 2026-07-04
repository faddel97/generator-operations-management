create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'supervisor', 'technician', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_status as enum ('draft', 'submitted', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generator_duty as enum ('prime', 'standby');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.asset_status as enum ('healthy', 'attention', 'critical', 'offline');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  address text,
  region text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generators (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete set null,
  generator_id text not null unique,
  manufacturer text not null,
  model text,
  serial_number text,
  year integer,
  rated_power_kw numeric,
  rated_power_kva numeric,
  rated_voltage numeric,
  rated_current numeric,
  frequency numeric,
  rpm integer,
  power_factor numeric,
  phase text,
  duty public.generator_duty not null default 'standby',
  engine_model text,
  engine_serial_number text,
  alternator_model text,
  alternator_serial_number text,
  dse_model text,
  fuel_tank_capacity numeric,
  operation_time numeric,
  health_score integer not null default 100 check (health_score between 0 and 100),
  status public.asset_status not null default 'healthy',
  next_maintenance_due date,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generator_photos (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  photo_type text not null,
  file_path text not null,
  caption text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.generator_files (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  file_type text not null,
  file_path text not null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_inspections (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  inspection_date date not null default current_date,
  checklist jsonb not null default '{}'::jsonb,
  overall_status public.asset_status not null default 'healthy',
  notes text,
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dse_readings (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  reading_date date not null default current_date,
  manual_start boolean default false,
  manual_stop boolean default false,
  return_to_auto boolean default false,
  running_hours numeric,
  number_of_starts integer,
  battery_voltage numeric,
  coolant_temperature numeric,
  engine_speed_rpm integer,
  alarm_screen text,
  event_log text,
  backup_file_path text,
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ats_tests (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  test_date date not null default current_date,
  checklist jsonb not null default '{}'::jsonb,
  generator_started boolean,
  ats_transfer boolean,
  ats_return boolean,
  breaker_operation boolean,
  alarm_during_test boolean,
  notes text,
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ats_manual_operations (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid references public.generators(id) on delete set null,
  operation_date date not null default current_date,
  case_type text not null check (case_type in ('stuck_on_mains', 'stuck_on_generator')),
  actions_completed jsonb not null default '{}'::jsonb,
  notes text,
  photo_paths text[] not null default '{}',
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  maintenance_date date not null default current_date,
  maintenance_type text not null check (maintenance_type in ('general', 'mechanical_inspection', 'battery', 'cleaning', 'corrective')),
  completed_items jsonb not null default '{}'::jsonb,
  picture_paths text[] not null default '{}',
  last_maintenance_date date,
  next_due_date date,
  permit_number text,
  tra_form_path text,
  gsa_form_path text,
  ptw_form_path text,
  signature text,
  notes text,
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maintenance_records
  add column if not exists picture_paths text[] not null default '{}',
  add column if not exists permit_number text,
  add column if not exists tra_form_path text,
  add column if not exists gsa_form_path text,
  add column if not exists ptw_form_path text,
  add column if not exists signature text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'maintenance_records_maintenance_type_check'
      and conrelid = 'public.maintenance_records'::regclass
  ) then
    alter table public.maintenance_records drop constraint maintenance_records_maintenance_type_check;
  end if;

  update public.maintenance_records
  set maintenance_type = case
    when maintenance_type = 'two_month_cleaning' then 'cleaning'
    when maintenance_type = 'three_month_service' then 'general'
    else maintenance_type
  end
  where maintenance_type in ('two_month_cleaning', 'three_month_service');

  alter table public.maintenance_records
    add constraint maintenance_records_maintenance_type_check
    check (maintenance_type in ('general', 'mechanical_inspection', 'battery', 'cleaning', 'corrective'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.load_tests (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  test_date date not null default current_date,
  load_level integer not null check (load_level in (80, 90, 100, 110)),
  approval_reference text,
  voltage numeric,
  frequency numeric,
  current numeric,
  kw numeric,
  kva numeric,
  power_factor numeric,
  oil_pressure numeric,
  coolant_temperature numeric,
  battery_voltage numeric,
  alarms text,
  notes text,
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vibration_tests (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid not null references public.generators(id) on delete cascade,
  test_date date not null default current_date,
  report_file_path text,
  trend_analysis_notes text,
  attachment_paths text[] not null default '{}',
  approval_status public.approval_status not null default 'submitted',
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid references public.generators(id) on delete cascade,
  alarm_date timestamptz not null default now(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  source text,
  message text not null,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  generator_id uuid references public.generators(id) on delete cascade,
  event_date timestamptz not null default now(),
  event_type text,
  message text not null,
  raw_payload jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_id uuid not null,
  status public.approval_status not null default 'submitted',
  notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null check (report_type in ('weekly', 'monthly', 'generator_health', 'maintenance_due', 'alarm_history', 'event_log_analysis')),
  title text not null,
  period_start date,
  period_end date,
  filters jsonb not null default '{}'::jsonb,
  generated_payload jsonb not null default '{}'::jsonb,
  export_file_path text,
  generated_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_generators_site_id on public.generators(site_id);
create index if not exists idx_generators_next_maintenance_due on public.generators(next_maintenance_due);
create index if not exists idx_weekly_inspections_generator_date on public.weekly_inspections(generator_id, inspection_date desc);
create index if not exists idx_dse_readings_generator_date on public.dse_readings(generator_id, reading_date desc);
create index if not exists idx_ats_tests_generator_date on public.ats_tests(generator_id, test_date desc);
create index if not exists idx_maintenance_records_generator_date on public.maintenance_records(generator_id, maintenance_date desc);
create index if not exists idx_alarms_generator_date on public.alarms(generator_id, alarm_date desc);
create index if not exists idx_event_logs_generator_date on public.event_logs(generator_id, event_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.can_write_records()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'supervisor', 'technician'), false);
$$;

create or replace function public.can_review_records()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'supervisor'), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_next_maintenance_due(
  maintenance_type text,
  maintenance_date date
)
returns date
language sql
immutable
as $$
  select case
    when maintenance_type = 'cleaning' then maintenance_date + interval '2 months'
    when maintenance_type in ('general', 'mechanical_inspection', 'battery') then maintenance_date + interval '3 months'
    else maintenance_date
  end::date;
$$;

create or replace function public.set_maintenance_due_date()
returns trigger
language plpgsql
as $$
begin
  if new.next_due_date is null then
    new.next_due_date = public.calculate_next_maintenance_due(new.maintenance_type, new.maintenance_date);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'sites', 'generators', 'weekly_inspections', 'dse_readings',
    'ats_tests', 'ats_manual_operations', 'maintenance_records', 'load_tests',
    'vibration_tests', 'alarms', 'event_logs', 'approvals', 'reports'
  ]
  loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

drop trigger if exists set_maintenance_due_date on public.maintenance_records;
create trigger set_maintenance_due_date
before insert or update on public.maintenance_records
for each row execute function public.set_maintenance_due_date();

alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.generators enable row level security;
alter table public.generator_photos enable row level security;
alter table public.generator_files enable row level security;
alter table public.weekly_inspections enable row level security;
alter table public.dse_readings enable row level security;
alter table public.ats_tests enable row level security;
alter table public.ats_manual_operations enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.load_tests enable row level security;
alter table public.vibration_tests enable row level security;
alter table public.alarms enable row level security;
alter table public.event_logs enable row level security;
alter table public.approvals enable row level security;
alter table public.reports enable row level security;

drop policy if exists "users can read profiles" on public.users;
create policy "users can read profiles"
on public.users for select
to authenticated
using (true);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage users" on public.users;
create policy "admins can manage users"
on public.users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array['sites', 'generators', 'generator_photos', 'generator_files', 'alarms', 'event_logs', 'reports']
  loop
    execute format('drop policy if exists "%s read" on public.%I', table_name, table_name);
    execute format('create policy "%s read" on public.%I for select to authenticated using (public.current_user_role() is not null)', table_name, table_name);
    execute format('drop policy if exists "%s insert" on public.%I', table_name, table_name);
    execute format('create policy "%s insert" on public.%I for insert to authenticated with check (public.can_write_records())', table_name, table_name);
    execute format('drop policy if exists "%s update" on public.%I', table_name, table_name);
    execute format('create policy "%s update" on public.%I for update to authenticated using (public.can_write_records()) with check (public.can_write_records())', table_name, table_name);
    execute format('drop policy if exists "%s delete" on public.%I', table_name, table_name);
    execute format('create policy "%s delete" on public.%I for delete to authenticated using (public.is_admin())', table_name, table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['weekly_inspections', 'dse_readings', 'ats_tests', 'ats_manual_operations', 'maintenance_records', 'load_tests', 'vibration_tests']
  loop
    execute format('drop policy if exists "%s read" on public.%I', table_name, table_name);
    execute format('create policy "%s read" on public.%I for select to authenticated using (public.current_user_role() is not null)', table_name, table_name);
    execute format('drop policy if exists "%s insert" on public.%I', table_name, table_name);
    execute format('create policy "%s insert" on public.%I for insert to authenticated with check (public.can_write_records())', table_name, table_name);
    execute format('drop policy if exists "%s update" on public.%I', table_name, table_name);
    execute format('create policy "%s update" on public.%I for update to authenticated using (public.is_admin() or public.can_review_records() or created_by = auth.uid() or submitted_by = auth.uid()) with check (public.can_write_records())', table_name, table_name);
    execute format('drop policy if exists "%s delete" on public.%I', table_name, table_name);
    execute format('create policy "%s delete" on public.%I for delete to authenticated using (public.is_admin())', table_name, table_name);
  end loop;
end $$;

drop policy if exists "approvals read" on public.approvals;
create policy "approvals read"
on public.approvals for select
to authenticated
using (public.current_user_role() is not null);

drop policy if exists "approvals write" on public.approvals;
create policy "approvals write"
on public.approvals for insert
to authenticated
with check (public.can_review_records());

drop policy if exists "approvals update" on public.approvals;
create policy "approvals update"
on public.approvals for update
to authenticated
using (public.can_review_records())
with check (public.can_review_records());

drop policy if exists "approvals delete" on public.approvals;
create policy "approvals delete"
on public.approvals for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('generator-photos', 'generator-photos', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('generator-files', 'generator-files', false, 52428800, array['application/pdf', 'text/plain', 'application/octet-stream', 'application/zip']),
  ('operation-attachments', 'operation-attachments', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'application/octet-stream', 'application/zip'])
on conflict (id) do nothing;

drop policy if exists "operations storage read" on storage.objects;
create policy "operations storage read"
on storage.objects for select
to authenticated
using (bucket_id in ('generator-photos', 'generator-files', 'operation-attachments'));

drop policy if exists "operations storage upload" on storage.objects;
create policy "operations storage upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('generator-photos', 'generator-files', 'operation-attachments')
  and public.can_write_records()
);

drop policy if exists "operations storage update" on storage.objects;
create policy "operations storage update"
on storage.objects for update
to authenticated
using (bucket_id in ('generator-photos', 'generator-files', 'operation-attachments') and public.can_write_records())
with check (bucket_id in ('generator-photos', 'generator-files', 'operation-attachments') and public.can_write_records());

drop policy if exists "operations storage delete" on storage.objects;
create policy "operations storage delete"
on storage.objects for delete
to authenticated
using (bucket_id in ('generator-photos', 'generator-files', 'operation-attachments') and public.is_admin());
