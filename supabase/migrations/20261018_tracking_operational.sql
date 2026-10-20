-- Run after 20261018_tracking_foundation.sql. No surveyed geometry or locations are seeded.
create table if not exists public.tracking_facilities (
  key text primary key,
  name text not null,
  reference_latitude double precision not null,
  reference_longitude double precision not null,
  perimeter_geojson jsonb,
  perimeter_area_m2 double precision,
  draft_geojson jsonb,
  draft_area_m2 double precision,
  geometry_source text,
  geometry_status text not null default 'awaiting_configuration' check (geometry_status in ('awaiting_configuration', 'draft', 'published')),
  configured_by uuid references public.users(id) on delete set null,
  configured_at timestamptz,
  updated_at timestamptz not null default now(),
  check (perimeter_geojson is null or (jsonb_typeof(perimeter_geojson) = 'object' and perimeter_geojson->>'type' = 'Polygon'))
);

insert into public.tracking_facilities (key, name, reference_latitude, reference_longitude)
values ('imi-ras-al-khair', 'IMI Ras Al-Khair', 27.5089855, 49.2384049)
on conflict (key) do nothing;

alter table public.tracking_zones alter column polygon_geojson drop not null;
alter table public.tracking_zones add column if not exists facility_key text references public.tracking_facilities(key);
alter table public.tracking_zones add column if not exists code text;
alter table public.tracking_zones add column if not exists function_description text;
alter table public.tracking_zones add column if not exists parent_zone_id uuid references public.tracking_zones(id) on delete set null;
alter table public.tracking_zones add column if not exists geometry_status text not null default 'awaiting_configuration' check (geometry_status in ('awaiting_configuration', 'draft', 'published'));
alter table public.tracking_zones add column if not exists geometry_source text;
alter table public.tracking_zones add column if not exists area_m2 double precision;
alter table public.tracking_zones add column if not exists draft_geojson jsonb;
alter table public.tracking_zones add column if not exists draft_area_m2 double precision;
alter table public.tracking_zones add column if not exists configured_by uuid references public.users(id) on delete set null;
alter table public.tracking_zones add column if not exists configured_at timestamptz;
create unique index if not exists tracking_zones_facility_code_idx on public.tracking_zones(facility_key, code) where code is not null;

insert into public.tracking_zones (facility_key, code, name, kind, color, polygon_geojson, function_description)
values
 ('imi-ras-al-khair', 'A', 'MRO', 'operational', '#0f766e', null, 'Maintenance, repair and overhaul of commercial vessels, offshore support vessels and rigs'),
 ('imi-ras-al-khair', 'B', 'OSV Construction', 'operational', '#2563eb', null, 'New construction of offshore support vessels'),
 ('imi-ras-al-khair', 'C', 'Commercial Shipbuilding', 'operational', '#7c3aed', null, 'Construction of commercial vessels'),
 ('imi-ras-al-khair', 'D', 'Offshore Rig Construction', 'operational', '#d97706', null, 'New construction of offshore jack-up drilling rigs and related equipment')
on conflict (facility_key, code) where code is not null do nothing;

alter table public.tracking_assets add column if not exists availability_status text not null default 'unknown' check (availability_status in ('available', 'in_use', 'maintenance', 'unknown'));
alter table public.tracking_assets add column if not exists facility_key text references public.tracking_facilities(key);
alter table public.tracking_assets add column if not exists availability_updated_at timestamptz;
alter table public.tracking_assets add column if not exists availability_updated_by uuid references public.users(id) on delete set null;
alter table public.tracking_assets add column if not exists registered_zone_id uuid references public.tracking_zones(id) on delete set null;

alter table public.tracking_positions alter column device_id drop not null;
alter table public.tracking_positions add column if not exists source text not null default 'gps' check (source in ('gps', 'manual'));
alter table public.tracking_positions add column if not exists reported_by uuid references public.users(id) on delete set null;
alter table public.tracking_positions add column if not exists uncertainty_note text;
create unique index if not exists tracking_manual_event_idx on public.tracking_positions(event_id) where source = 'manual';

-- A manual observation and latest-position pointer are committed atomically.
create or replace function public.record_manual_tracking_position(
  p_asset_id uuid, p_event_id text, p_latitude double precision, p_longitude double precision,
  p_accuracy_m double precision, p_recorded_at timestamptz, p_uncertainty_note text default null
) returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if not public.can_write_records() then raise exception 'permission denied'; end if;
  if not exists(select 1 from public.tracking_assets where id = p_asset_id and archived_at is null) then raise exception 'asset not found'; end if;
  if p_event_id is null or length(p_event_id) not between 1 and 120 then raise exception 'invalid event ID'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'invalid coordinates'; end if;
  if p_accuracy_m is null or p_accuracy_m not between 1 and 10000 then raise exception 'invalid uncertainty'; end if;
  if p_recorded_at > now() + interval '5 minutes' or p_recorded_at < now() - interval '7 days' then raise exception 'timestamp out of range'; end if;
  perform pg_advisory_xact_lock(hashtext(p_asset_id::text));
  insert into public.tracking_positions(asset_id, event_id, recorded_at, latitude, longitude, accuracy_m, source, reported_by, uncertainty_note)
  values(p_asset_id, p_event_id, p_recorded_at, p_latitude, p_longitude, p_accuracy_m, 'manual', auth.uid(), left(p_uncertainty_note, 500))
  returning id into v_id;
  insert into public.tracking_current_positions(asset_id, position_id, recorded_at) values(p_asset_id, v_id, p_recorded_at)
  on conflict (asset_id) do update set position_id = excluded.position_id, recorded_at = excluded.recorded_at
  where excluded.recorded_at > public.tracking_current_positions.recorded_at;
  return v_id;
end $$;
revoke all on function public.record_manual_tracking_position(uuid, text, double precision, double precision, double precision, timestamptz, text) from public, anon;
grant execute on function public.record_manual_tracking_position(uuid, text, double precision, double precision, double precision, timestamptz, text) to authenticated;

-- Small-zone WGS84 point-in-polygon check. For large installations, migrate to PostGIS.
create or replace function public.tracking_polygon_contains(p_polygon jsonb, p_longitude double precision, p_latitude double precision)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  v_ring jsonb := p_polygon->'coordinates'->0;
  v_count integer;
  v_i integer;
  v_x1 double precision; v_y1 double precision; v_x2 double precision; v_y2 double precision;
  v_inside boolean := false;
begin
  if v_ring is null or jsonb_typeof(v_ring) <> 'array' then return false; end if;
  v_count := jsonb_array_length(v_ring);
  if v_count < 4 then return false; end if;
  for v_i in 0..v_count-2 loop
    v_x1 := (v_ring->v_i->>0)::double precision;
    v_y1 := (v_ring->v_i->>1)::double precision;
    v_x2 := (v_ring->(v_i+1)->>0)::double precision;
    v_y2 := (v_ring->(v_i+1)->>1)::double precision;
    if (v_y1 > p_latitude) <> (v_y2 > p_latitude) and
       p_longitude < (v_x2-v_x1) * (p_latitude-v_y1) / nullif(v_y2-v_y1, 0) + v_x1 then
      v_inside := not v_inside;
    end if;
  end loop;
  return v_inside;
end $$;

-- Runs only when the latest-position pointer changes. A first fix establishes a
-- baseline; it is not a fabricated entry event. Unpublished geometry is ignored.
create or replace function public.tracking_geofence_on_current()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old public.tracking_positions%rowtype;
  v_new public.tracking_positions%rowtype;
  v_facility_key text;
  v_perimeter jsonb;
  v_zone record;
  v_old_inside boolean;
  v_new_inside boolean;
begin
  if tg_op <> 'UPDATE' or old.position_id = new.position_id then return new; end if;
  select * into v_old from public.tracking_positions where id = old.position_id;
  select * into v_new from public.tracking_positions where id = new.position_id;
  if v_old.id is null or v_new.id is null then return new; end if;
  select facility_key into v_facility_key from public.tracking_assets where id = new.asset_id;
  if v_facility_key is null then return new; end if;
  select perimeter_geojson into v_perimeter from public.tracking_facilities
    where key = v_facility_key and geometry_status = 'published';
  if v_perimeter is not null then
    v_old_inside := public.tracking_polygon_contains(v_perimeter, v_old.longitude, v_old.latitude);
    v_new_inside := public.tracking_polygon_contains(v_perimeter, v_new.longitude, v_new.latitude);
    if v_old_inside and not v_new_inside then
      insert into public.tracking_alerts(asset_id, kind, severity, message, occurred_at, dedupe_key)
      values(new.asset_id, 'yard_exit', 'critical', 'Asset exited configured yard perimeter', v_new.recorded_at, 'yard_exit:' || new.position_id)
      on conflict (dedupe_key) do nothing;
    end if;
  end if;
  for v_zone in select id, name, kind, polygon_geojson from public.tracking_zones
    where facility_key = v_facility_key and geometry_status = 'published' and polygon_geojson is not null loop
    v_old_inside := public.tracking_polygon_contains(v_zone.polygon_geojson, v_old.longitude, v_old.latitude);
    v_new_inside := public.tracking_polygon_contains(v_zone.polygon_geojson, v_new.longitude, v_new.latitude);
    if v_old_inside <> v_new_inside then
      insert into public.tracking_alerts(asset_id, kind, severity, message, occurred_at, dedupe_key)
      values(new.asset_id,
        case when v_new_inside and v_zone.kind = 'restricted' then 'restricted_entry' when v_new_inside then 'zone_entry' else 'zone_exit' end,
        case when v_new_inside and v_zone.kind = 'restricted' then 'critical' else 'info' end,
        case when v_new_inside then 'Entered ' else 'Exited ' end || v_zone.name,
        v_new.recorded_at, 'zone:' || v_zone.id || ':' || new.position_id)
      on conflict (dedupe_key) do nothing;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists tracking_geofence_current on public.tracking_current_positions;
create trigger tracking_geofence_current after update of position_id on public.tracking_current_positions
for each row execute function public.tracking_geofence_on_current();

alter table public.tracking_facilities enable row level security;
create policy "tracking facilities read" on public.tracking_facilities for select to authenticated using (public.current_user_role() is not null);
create policy "tracking facilities admin update" on public.tracking_facilities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tracking facilities admin insert" on public.tracking_facilities for insert to authenticated with check (public.is_admin());
