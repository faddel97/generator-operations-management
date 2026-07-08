-- Apply this in the Supabase SQL editor after the base schema is already in place.
-- It turns event_logs into an immutable audit trail and auto-records create/update/delete
-- activity from the app's core tables.

begin;

drop trigger if exists prevent_event_logs_mutation on public.event_logs;

alter table public.event_logs drop constraint if exists event_logs_generator_id_fkey;

update public.event_logs e
set generator_id = null
where e.generator_id is not null
  and not exists (
    select 1 from public.generators g where g.id = e.generator_id
  );

alter table public.event_logs
  add constraint event_logs_generator_id_fkey
  foreign key (generator_id) references public.generators(id) on delete set null;

alter table public.event_logs
  add column if not exists event_action text,
  add column if not exists entity_table text,
  add column if not exists entity_id text,
  add column if not exists entity_label text,
  add column if not exists actor_id uuid references public.users(id) on delete set null,
  add column if not exists actor_email text,
  add column if not exists actor_name text,
  add column if not exists actor_role public.app_role,
  add column if not exists changed_fields text[] not null default '{}',
  add column if not exists before_data jsonb,
  add column if not exists after_data jsonb,
  add column if not exists details jsonb not null default '{}'::jsonb;

update public.event_logs
set
  event_action = coalesce(event_action, 'insert'),
  entity_table = coalesce(entity_table, 'event_logs'),
  entity_id = coalesce(entity_id, id::text),
  entity_label = coalesce(entity_label, message),
  details = coalesce(details, raw_payload, '{}'::jsonb),
  raw_payload = coalesce(raw_payload, jsonb_build_object('message', message)),
  changed_fields = coalesce(changed_fields, '{}'::text[]),
  before_data = coalesce(before_data, '{}'::jsonb),
  after_data = coalesce(after_data, raw_payload, '{}'::jsonb)
where event_action is null
   or entity_table is null
   or entity_id is null
   or entity_label is null
   or details = '{}'::jsonb;

create index if not exists idx_event_logs_event_date on public.event_logs(event_date desc);
create index if not exists idx_event_logs_entity_table_date on public.event_logs(entity_table, event_date desc);

create or replace function public.audit_clean_row(source_row jsonb)
returns jsonb
language sql
stable
as $$
  select coalesce(source_row, '{}'::jsonb) - array['created_at', 'updated_at']::text[];
$$;

create or replace function public.audit_changed_fields(old_row jsonb, new_row jsonb)
returns text[]
language sql
stable
as $$
  select coalesce(array_agg(key order by key), '{}'::text[])
  from (
    select key
    from (
      select jsonb_object_keys(coalesce(old_row, '{}'::jsonb)) as key
      union
      select jsonb_object_keys(coalesce(new_row, '{}'::jsonb)) as key
    ) keys
    where key not in ('created_at', 'updated_at')
      and coalesce(old_row -> key, 'null'::jsonb) is distinct from coalesce(new_row -> key, 'null'::jsonb)
  ) changed;
$$;

create or replace function public.audit_entity_name(table_name text)
returns text
language sql
immutable
as $$
  select case table_name
    when 'users' then 'user profile'
    when 'sites' then 'site'
    when 'generators' then 'generator'
    when 'generator_photos' then 'generator photo'
    when 'generator_files' then 'generator file'
    when 'weekly_inspections' then 'weekly inspection'
    when 'dse_readings' then 'DSE reading'
    when 'ats_tests' then 'ATS test'
    when 'ats_manual_operations' then 'ATS manual operation'
    when 'maintenance_records' then 'maintenance record'
    when 'load_tests' then 'load test'
    when 'vibration_tests' then 'vibration test'
    when 'alarms' then 'alarm'
    when 'approvals' then 'approval'
    when 'reports' then 'report'
    else replace(table_name, '_', ' ')
  end;
$$;

create or replace function public.audit_entity_label(
  table_name text,
  record_data jsonb,
  related_generator_id uuid default null
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  generator_label text;
begin
  if related_generator_id is not null then
    select g.generator_id
    into generator_label
    from public.generators g
    where g.id = related_generator_id;

    if generator_label is not null then
      return generator_label;
    end if;
  end if;

  case table_name
    when 'generators' then
      return coalesce(nullif(record_data->>'generator_id', ''), nullif(record_data->>'id', ''));
    when 'users' then
      return coalesce(nullif(record_data->>'full_name', ''), nullif(record_data->>'email', ''), nullif(record_data->>'id', ''));
    when 'sites' then
      return coalesce(nullif(record_data->>'code', ''), nullif(record_data->>'name', ''), nullif(record_data->>'id', ''));
    when 'generator_photos' then
      return coalesce(nullif(record_data->>'photo_type', ''), nullif(record_data->>'id', ''));
    when 'generator_files' then
      return coalesce(nullif(record_data->>'file_type', ''), nullif(record_data->>'id', ''));
    when 'reports' then
      return coalesce(nullif(record_data->>'title', ''), nullif(record_data->>'report_type', ''), nullif(record_data->>'id', ''));
    when 'alarms' then
      return coalesce(left(nullif(record_data->>'message', ''), 120), nullif(record_data->>'id', ''));
    when 'approvals' then
      return coalesce(nullif(record_data->>'target_table', ''), nullif(record_data->>'id', ''));
    else
      return coalesce(
        nullif(record_data->>'title', ''),
        nullif(record_data->>'event_type', ''),
        nullif(record_data->>'maintenance_type', ''),
        nullif(record_data->>'report_type', ''),
        nullif(record_data->>'name', ''),
        nullif(record_data->>'message', ''),
        nullif(record_data->>'id', '')
      );
  end case;
end;
$$;

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  actor_name text;
  actor_role public.app_role;
  old_data jsonb := case when TG_OP in ('UPDATE', 'DELETE') then public.audit_clean_row(to_jsonb(OLD)) else null end;
  new_data jsonb := case when TG_OP in ('INSERT', 'UPDATE') then public.audit_clean_row(to_jsonb(NEW)) else null end;
  record_data jsonb := coalesce(new_data, old_data);
  related_generator_id uuid := null;
  entity_id text := coalesce(new_data->>'id', old_data->>'id');
  entity_label text;
  changed_fields text[] := public.audit_changed_fields(old_data, new_data);
  event_action text := lower(TG_OP);
  event_summary text;
  payload jsonb;
begin
  if actor_id is not null then
    select u.email, u.full_name, u.role
    into actor_email, actor_name, actor_role
    from public.users u
    where u.id = actor_id;
  end if;

  case TG_TABLE_NAME
    when 'generators' then
      related_generator_id := coalesce((new_data->>'id')::uuid, (old_data->>'id')::uuid);
    when 'generator_photos', 'generator_files', 'weekly_inspections', 'dse_readings', 'ats_tests', 'ats_manual_operations', 'maintenance_records', 'load_tests', 'vibration_tests', 'alarms' then
      related_generator_id := coalesce((new_data->>'generator_id')::uuid, (old_data->>'generator_id')::uuid);
    else
      related_generator_id := null;
  end case;

  if related_generator_id is not null and not exists (
    select 1 from public.generators where id = related_generator_id
  ) then
    related_generator_id := null;
  end if;

  entity_label := public.audit_entity_label(TG_TABLE_NAME, record_data, related_generator_id);
  event_summary := format(
    '%s %s %s by %s',
    initcap(event_action),
    public.audit_entity_name(TG_TABLE_NAME),
    entity_label,
    coalesce(actor_name, actor_email, 'System')
  );
  payload := jsonb_build_object(
    'action', event_action,
    'table', TG_TABLE_NAME,
    'entity_id', entity_id,
    'entity_label', entity_label,
    'actor', jsonb_build_object(
      'id', actor_id,
      'email', actor_email,
      'name', actor_name,
      'role', actor_role
    ),
    'changed_fields', changed_fields,
    'before', old_data,
    'after', new_data
  );

  insert into public.event_logs (
    generator_id,
    event_date,
    event_type,
    event_action,
    entity_table,
    entity_id,
    entity_label,
    message,
    raw_payload,
    actor_id,
    actor_email,
    actor_name,
    actor_role,
    changed_fields,
    before_data,
    after_data,
    details,
    created_by
  )
  values (
    related_generator_id,
    now(),
    TG_TABLE_NAME,
    event_action,
    TG_TABLE_NAME,
    entity_id,
    entity_label,
    event_summary,
    payload,
    actor_id,
    actor_email,
    actor_name,
    actor_role,
    changed_fields,
    old_data,
    new_data,
    payload,
    actor_id
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

create or replace function public.prevent_event_log_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
    and OLD.generator_id is not null
    and NEW.generator_id is null
    and (to_jsonb(NEW) - 'generator_id') = (to_jsonb(OLD) - 'generator_id')
  then
    return NEW;
  end if;

  raise exception 'Event logs are immutable.';
end;
$$;

drop policy if exists "event_logs read" on public.event_logs;
create policy "event_logs read"
on public.event_logs for select
to authenticated
using (public.current_user_role() in ('admin', 'supervisor', 'technician'));

drop policy if exists "event_logs insert" on public.event_logs;
drop policy if exists "event_logs update" on public.event_logs;
drop policy if exists "event_logs delete" on public.event_logs;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'sites', 'generators', 'generator_photos', 'generator_files',
    'weekly_inspections', 'dse_readings', 'ats_tests', 'ats_manual_operations',
    'maintenance_records', 'load_tests', 'vibration_tests', 'alarms',
    'approvals', 'reports'
  ]
  loop
    execute format('drop trigger if exists audit_%s_events on public.%I', table_name, table_name);
    execute format(
      'create trigger audit_%s_events after insert or update or delete on public.%I for each row execute function public.record_audit_event()',
      table_name,
      table_name
    );
  end loop;
end $$;

create trigger prevent_event_logs_mutation
before update or delete on public.event_logs
for each row execute function public.prevent_event_log_mutation();

commit;
