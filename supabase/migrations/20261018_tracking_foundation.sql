-- Additive GPS tracking foundation. Run after supabase/schema.sql.
-- Demo data is deliberately never inserted into these production tables.

create table if not exists public.tracking_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  name text not null,
  category text not null check (category in ('truck', 'forklift', 'vehicle', 'machinery', 'heavy_equipment', 'trailer', 'portable', 'other')),
  site_id uuid references public.sites(id) on delete set null,
  generator_id uuid unique references public.generators(id) on delete set null,
  operational_status text not null default 'unknown' check (operational_status in ('active', 'inactive', 'maintenance', 'unknown')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_devices (
  id uuid primary key default gen_random_uuid(),
  hardware_id text not null unique,
  asset_id uuid not null unique references public.tracking_assets(id) on delete cascade,
  credential_sha256 text not null check (length(credential_sha256) = 64),
  active boolean not null default true,
  last_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_positions (
  id bigint generated always as identity primary key,
  asset_id uuid not null references public.tracking_assets(id) on delete cascade,
  device_id uuid not null references public.tracking_devices(id) on delete cascade,
  event_id text not null,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision check (accuracy_m between 0 and 10000),
  speed_kph double precision check (speed_kph between 0 and 400),
  heading_degrees double precision check (heading_degrees >= 0 and heading_degrees < 360),
  fuel_percent double precision check (fuel_percent between 0 and 100),
  unique (device_id, event_id)
);

create index if not exists tracking_positions_asset_time_idx on public.tracking_positions(asset_id, recorded_at desc);
create index if not exists tracking_positions_geo_idx on public.tracking_positions(latitude, longitude);

create table if not exists public.tracking_current_positions (
  asset_id uuid primary key references public.tracking_assets(id) on delete cascade,
  position_id bigint not null unique references public.tracking_positions(id) on delete cascade,
  recorded_at timestamptz not null
);

create table if not exists public.tracking_zones (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  name text not null,
  kind text not null default 'operational' check (kind in ('yard', 'operational', 'restricted')),
  color text not null default '#0f766e',
  polygon_geojson jsonb not null check (jsonb_typeof(polygon_geojson) = 'object' and polygon_geojson->>'type' = 'Polygon'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_alerts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.tracking_assets(id) on delete cascade,
  kind text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  message text not null,
  occurred_at timestamptz not null,
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.users(id) on delete set null,
  dedupe_key text unique
);

create index if not exists tracking_alerts_asset_time_idx on public.tracking_alerts(asset_id, occurred_at desc);

create or replace function public.ingest_tracking_position(
  p_device_id uuid,
  p_event_id text,
  p_recorded_at timestamptz,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision default null,
  p_speed_kph double precision default null,
  p_heading_degrees double precision default null,
  p_fuel_percent double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset_id uuid;
  v_position_id bigint;
  v_inserted boolean := true;
  v_is_current boolean := false;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if p_event_id is null or length(p_event_id) not between 1 and 120 then raise exception 'invalid event ID'; end if;
  if p_recorded_at > now() + interval '5 minutes' or p_recorded_at < now() - interval '7 days' then raise exception 'timestamp out of range'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'coordinates out of range'; end if;
  select asset_id into v_asset_id from public.tracking_devices where id = p_device_id and active;
  if v_asset_id is null then raise exception 'device not active'; end if;

  perform pg_advisory_xact_lock(hashtext(v_asset_id::text));
  insert into public.tracking_positions (asset_id, device_id, event_id, recorded_at, latitude, longitude, accuracy_m, speed_kph, heading_degrees, fuel_percent)
  values (v_asset_id, p_device_id, p_event_id, p_recorded_at, p_latitude, p_longitude, p_accuracy_m, p_speed_kph, p_heading_degrees, p_fuel_percent)
  on conflict (device_id, event_id) do nothing
  returning id into v_position_id;

  if v_position_id is null then
    v_inserted := false;
    select id into v_position_id from public.tracking_positions where device_id = p_device_id and event_id = p_event_id;
  else
    insert into public.tracking_current_positions (asset_id, position_id, recorded_at)
    values (v_asset_id, v_position_id, p_recorded_at)
    on conflict (asset_id) do update set position_id = excluded.position_id, recorded_at = excluded.recorded_at
    where excluded.recorded_at > public.tracking_current_positions.recorded_at;
  end if;
  select position_id = v_position_id into v_is_current from public.tracking_current_positions where asset_id = v_asset_id;
  update public.tracking_devices set last_received_at = now() where id = p_device_id;
  return jsonb_build_object('inserted', v_inserted, 'current', coalesce(v_is_current, false), 'position_id', v_position_id);
end;
$$;

revoke all on function public.ingest_tracking_position(uuid, text, timestamptz, double precision, double precision, double precision, double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.ingest_tracking_position(uuid, text, timestamptz, double precision, double precision, double precision, double precision, double precision, double precision) to service_role;

do $$
declare t text;
begin
  foreach t in array array['tracking_assets', 'tracking_devices', 'tracking_zones'] loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', t, t);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.tracking_assets enable row level security;
alter table public.tracking_devices enable row level security;
alter table public.tracking_positions enable row level security;
alter table public.tracking_current_positions enable row level security;
alter table public.tracking_zones enable row level security;
alter table public.tracking_alerts enable row level security;

create policy "tracking assets read" on public.tracking_assets for select to authenticated using (public.current_user_role() is not null);
create policy "tracking assets admin insert" on public.tracking_assets for insert to authenticated with check (public.is_admin());
create policy "tracking assets admin update" on public.tracking_assets for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tracking devices admin read" on public.tracking_devices for select to authenticated using (public.is_admin());
create policy "tracking devices admin insert" on public.tracking_devices for insert to authenticated with check (public.is_admin());
create policy "tracking devices admin update" on public.tracking_devices for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke select on public.tracking_devices from authenticated;
grant select (id, hardware_id, asset_id, active, last_received_at, created_at, updated_at) on public.tracking_devices to authenticated;
create policy "tracking positions read" on public.tracking_positions for select to authenticated using (public.current_user_role() is not null);
create policy "tracking current read" on public.tracking_current_positions for select to authenticated using (public.current_user_role() is not null);
create policy "tracking zones read" on public.tracking_zones for select to authenticated using (public.current_user_role() is not null);
create policy "tracking zones admin write" on public.tracking_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tracking alerts read" on public.tracking_alerts for select to authenticated using (public.current_user_role() is not null);
create policy "tracking alerts review" on public.tracking_alerts for update to authenticated using (public.can_review_records()) with check (public.can_review_records());
