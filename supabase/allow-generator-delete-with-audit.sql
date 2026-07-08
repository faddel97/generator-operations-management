-- Run this in Supabase SQL Editor if deleting a generator fails after audit logs were enabled.
-- It keeps event logs immutable, but allows the database foreign key to clear only
-- event_logs.generator_id when the related generator is deleted.

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

create trigger prevent_event_logs_mutation
before update or delete on public.event_logs
for each row execute function public.prevent_event_log_mutation();

commit;
