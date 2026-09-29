-- Set the display name for the existing Supabase account and its audit history.
-- Run this once in the Supabase SQL Editor for the production project.

begin;

-- This is a one-time repair for existing audit history. Temporarily remove the
-- immutable-log trigger, then restore it before committing the transaction.
drop trigger if exists prevent_event_logs_mutation on public.event_logs;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('full_name', 'Ali Alisaihati')
where lower(email) = lower('ali7m@hotmail.com');

insert into public.users (id, email, full_name)
select id, email, 'Ali Alisaihati'
from auth.users
where lower(email) = lower('ali7m@hotmail.com')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

update public.event_logs
set actor_email = 'ali7m@hotmail.com',
    actor_name = 'Ali Alisaihati',
    message = case
      when message ~* '\s+by\s*$'
        then regexp_replace(message, '\s+by\s*$', '', 'i') || ' by Ali Alisaihati'
      else message
    end
where lower(actor_email) = lower('ali7m@hotmail.com')
   or actor_id in (
     select id
     from auth.users
     where lower(email) = lower('ali7m@hotmail.com')
   );

create trigger prevent_event_logs_mutation
before update or delete on public.event_logs
for each row execute function public.prevent_event_log_mutation();

commit;
