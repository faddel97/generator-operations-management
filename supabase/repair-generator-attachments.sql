-- Run once in the Supabase SQL Editor for the production project.
-- It creates/updates generator storage and restores the policies required by the app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'generator-photos',
    'generator-photos',
    false,
    52428800,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
  ),
  ('generator-files', 'generator-files', false, 52428800, null)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.generator_photos enable row level security;
alter table public.generator_files enable row level security;

drop policy if exists "generator_photos read" on public.generator_photos;
create policy "generator_photos read"
on public.generator_photos for select
to authenticated
using (public.current_user_role() is not null);

drop policy if exists "generator_photos insert" on public.generator_photos;
create policy "generator_photos insert"
on public.generator_photos for insert
to authenticated
with check (public.can_write_records());

drop policy if exists "generator_files read" on public.generator_files;
create policy "generator_files read"
on public.generator_files for select
to authenticated
using (public.current_user_role() is not null);

drop policy if exists "generator_files insert" on public.generator_files;
create policy "generator_files insert"
on public.generator_files for insert
to authenticated
with check (public.can_write_records());

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
