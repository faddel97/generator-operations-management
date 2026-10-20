-- New facility-PDF coordinate layer. This does not alter operational tracking tables.
create table if not exists public.facility_map_places (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null check (kind in ('building','area','gate','parking')),
  x double precision not null check (x between 0 and 6429),
  y double precision not null check (y between 0 and 4500),
  radius_px double precision not null default 80 check (radius_px between 10 and 500),
  review_required boolean not null default true,
  aliases text[] not null default '{}',
  created_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_map_calibration (
  id integer primary key default 1 check (id = 1),
  control_points jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  rms_px double precision,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_map_translations (
  id uuid primary key default gen_random_uuid(),
  source_text text not null,
  english_text text not null,
  x double precision not null check (x between 0 and 6429),
  y double precision not null check (y between 0 and 4500),
  width double precision not null check (width between 5 and 1000),
  height double precision not null check (height between 5 and 300),
  verified_by uuid not null references public.users(id),
  verified_at timestamptz not null default now()
);

create table if not exists public.facility_map_asset_points (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.tracking_assets(id) on delete cascade,
  generator_id uuid references public.generators(id) on delete cascade,
  x double precision not null check (x between 0 and 6429),
  y double precision not null check (y between 0 and 4500),
  observed_at timestamptz not null default now(),
  source text not null default 'manual' check (source = 'manual'),
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check ((asset_id is null) <> (generator_id is null))
);
create unique index if not exists facility_map_asset_points_asset_uidx on public.facility_map_asset_points(asset_id) where asset_id is not null;
create unique index if not exists facility_map_asset_points_generator_uidx on public.facility_map_asset_points(generator_id) where generator_id is not null;

create table if not exists public.facility_map_manual_observations (
  id bigint generated always as identity primary key,
  asset_id uuid references public.tracking_assets(id) on delete cascade,
  generator_id uuid references public.generators(id) on delete cascade,
  x double precision not null,
  y double precision not null,
  observed_at timestamptz not null,
  reported_by uuid references public.users(id) on delete set null,
  check ((asset_id is null) <> (generator_id is null))
);
create index if not exists facility_map_manual_asset_history_idx on public.facility_map_manual_observations(asset_id, observed_at desc);
create index if not exists facility_map_manual_generator_history_idx on public.facility_map_manual_observations(generator_id, observed_at desc);

create or replace function public.facility_map_log_manual_point() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.facility_map_manual_observations(asset_id, generator_id, x, y, observed_at, reported_by)
  values (new.asset_id, new.generator_id, new.x, new.y, new.observed_at, new.updated_by);
  return new;
end $$;
drop trigger if exists facility_map_manual_point_history on public.facility_map_asset_points;
create trigger facility_map_manual_point_history after insert or update on public.facility_map_asset_points
for each row execute function public.facility_map_log_manual_point();

create table if not exists public.facility_map_usage (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null,
  operator_id uuid not null references public.users(id),
  checkout_at timestamptz not null default now(),
  checkout_x double precision check (checkout_x between 0 and 6429),
  checkout_y double precision check (checkout_y between 0 and 4500),
  checkout_position_at timestamptz,
  return_due_at timestamptz,
  expected_parking_id uuid references public.facility_map_places(id),
  starting_fuel_percent double precision check (starting_fuel_percent between 0 and 100),
  return_attempted_at timestamptz,
  returned_at timestamptz,
  returned_by uuid references public.users(id),
  return_x double precision check (return_x between 0 and 6429),
  return_y double precision check (return_y between 0 and 4500),
  ending_fuel_percent double precision check (ending_fuel_percent between 0 and 100),
  return_verified boolean not null default false,
  return_matches_parking boolean,
  created_at timestamptz not null default now()
);
create index if not exists facility_map_usage_asset_time_idx on public.facility_map_usage(asset_key, checkout_at desc);
create unique index if not exists facility_map_one_active_checkout_idx on public.facility_map_usage(asset_key) where returned_at is null;

create table if not exists public.facility_map_fuel_observations (
  id bigint generated always as identity primary key,
  asset_key text not null,
  kind text not null check (kind in ('reading','refuel')),
  fuel_percent double precision not null check (fuel_percent between 0 and 100),
  observed_at timestamptz not null default now(),
  reported_by uuid not null references public.users(id),
  note text
);
create index if not exists facility_map_fuel_asset_time_idx on public.facility_map_fuel_observations(asset_key, observed_at desc);

create table if not exists public.facility_map_route_nodes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  x double precision not null check (x between 0 and 6429),
  y double precision not null check (y between 0 and 4500),
  verified boolean not null default false,
  created_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.facility_map_route_edges (
  id uuid primary key default gen_random_uuid(),
  from_node uuid not null references public.facility_map_route_nodes(id) on delete cascade,
  to_node uuid not null references public.facility_map_route_nodes(id) on delete cascade,
  permitted_modes text[] not null default array['walk'],
  restricted boolean not null default false,
  verified boolean not null default false,
  created_by uuid references public.users(id),
  updated_at timestamptz not null default now(),
  check (from_node <> to_node),
  unique (from_node, to_node)
);

create table if not exists public.facility_map_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function public.facility_map_write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if tg_op = 'DELETE' then v_id := old.id::text; else v_id := new.id::text; end if;
  insert into public.facility_map_audit(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), lower(tg_op), tg_table_name, v_id,
    jsonb_build_object('before', case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
                       'after', case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end));
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'facility_map_places', 'facility_map_calibration', 'facility_map_translations',
    'facility_map_asset_points', 'facility_map_usage', 'facility_map_fuel_observations',
    'facility_map_route_nodes', 'facility_map_route_edges'
  ] loop
    execute format('drop trigger if exists facility_map_audit_change on public.%I', t);
    execute format('create trigger facility_map_audit_change after insert or update or delete on public.%I for each row execute function public.facility_map_write_audit()', t);
  end loop;
end $$;

alter table public.facility_map_places enable row level security;
alter table public.facility_map_calibration enable row level security;
alter table public.facility_map_translations enable row level security;
alter table public.facility_map_asset_points enable row level security;
alter table public.facility_map_manual_observations enable row level security;
alter table public.facility_map_usage enable row level security;
alter table public.facility_map_fuel_observations enable row level security;
alter table public.facility_map_route_nodes enable row level security;
alter table public.facility_map_route_edges enable row level security;
alter table public.facility_map_audit enable row level security;

create policy "facility map places read" on public.facility_map_places for select to authenticated using (public.current_user_role() is not null);
create policy "facility map places admin" on public.facility_map_places for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "facility map calibration read" on public.facility_map_calibration for select to authenticated using (public.current_user_role() is not null);
create policy "facility map calibration admin" on public.facility_map_calibration for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "facility map translations read" on public.facility_map_translations for select to authenticated using (public.current_user_role() is not null);
create policy "facility map translations admin" on public.facility_map_translations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "facility map points read" on public.facility_map_asset_points for select to authenticated using (public.current_user_role() is not null);
create policy "facility map points write" on public.facility_map_asset_points for all to authenticated using (public.can_write_records()) with check (public.can_write_records());
create policy "facility map manual history read" on public.facility_map_manual_observations for select to authenticated using (public.current_user_role() is not null);
create policy "facility map usage read" on public.facility_map_usage for select to authenticated using (public.current_user_role() is not null);
create policy "facility map usage write" on public.facility_map_usage for insert to authenticated with check (public.can_write_records() and operator_id = auth.uid());
create policy "facility map usage return" on public.facility_map_usage for update to authenticated using (public.can_write_records()) with check (public.can_write_records());
create policy "facility map fuel read" on public.facility_map_fuel_observations for select to authenticated using (public.current_user_role() is not null);
create policy "facility map fuel write" on public.facility_map_fuel_observations for insert to authenticated with check (public.can_write_records() and reported_by = auth.uid());
create policy "facility map nodes read" on public.facility_map_route_nodes for select to authenticated using (public.current_user_role() is not null);
create policy "facility map nodes admin" on public.facility_map_route_nodes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "facility map edges read" on public.facility_map_route_edges for select to authenticated using (public.current_user_role() is not null);
create policy "facility map edges admin" on public.facility_map_route_edges for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "facility map audit read" on public.facility_map_audit for select to authenticated using (public.is_admin());
create policy "facility map audit insert" on public.facility_map_audit for insert to authenticated with check (public.can_write_records() and actor_id = auth.uid());
