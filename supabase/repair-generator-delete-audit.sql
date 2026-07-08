-- Emergency repair for generator delete crashes after enabling audit logs.
-- Safe to run multiple times in Supabase SQL Editor.

begin;

-- The old event log trigger can block ON DELETE CASCADE while we change the FK.
drop trigger if exists prevent_event_logs_mutation on public.event_logs;

-- Event logs must survive generator deletion. Keep the audit row and clear the link.
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

drop policy if exists "event_logs insert" on public.event_logs;
drop policy if exists "event_logs update" on public.event_logs;
drop policy if exists "event_logs delete" on public.event_logs;

drop trigger if exists prevent_event_logs_mutation on public.event_logs;
create trigger prevent_event_logs_mutation
before update or delete on public.event_logs
for each row execute function public.prevent_event_log_mutation();

commit;
