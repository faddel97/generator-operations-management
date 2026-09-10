-- Set the display name for the existing Supabase account and its audit history.
-- Run this once in the Supabase SQL Editor for the production project.

begin;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('full_name', 'Ali Al-Saihati')
where lower(email) = lower('alim7@hotmail.com');

insert into public.users (id, email, full_name)
select id, email, 'Ali Al-Saihati'
from auth.users
where lower(email) = lower('alim7@hotmail.com')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

update public.event_logs
set actor_name = 'Ali Al-Saihati'
where lower(actor_email) = lower('alim7@hotmail.com');

commit;
