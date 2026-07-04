-- Demo seed data for UI preview and local testing only.
-- These records are intentionally generic and must not be treated as real generator data.

insert into public.sites (id, name, code, address, region)
values
  ('10000000-0000-0000-0000-000000000001', 'Demo Industrial Site', 'DEMO-SITE', 'Demo district', 'Demo region')
on conflict (id) do update
set name = excluded.name,
    code = excluded.code,
    address = excluded.address,
    region = excluded.region;

insert into public.generators (
  id,
  site_id,
  generator_id,
  manufacturer,
  model,
  serial_number,
  year,
  rated_power_kw,
  rated_power_kva,
  rated_voltage,
  rated_current,
  frequency,
  rpm,
  power_factor,
  phase,
  duty,
  engine_model,
  engine_serial_number,
  alternator_model,
  alternator_serial_number,
  dse_model,
  fuel_tank_capacity,
  operation_time,
  health_score,
  status,
  next_maintenance_due,
  notes
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'DEMO-GEN-001',
    'Demo Manufacturer',
    'DG-500',
    'DEMO-SN-001',
    2023,
    400,
    500,
    400,
    721,
    50,
    1500,
    0.8,
    '3 Phase',
    'standby',
    'Demo Engine',
    'DEMO-ENG-001',
    'Demo Alternator',
    'DEMO-ALT-001',
    'DSE 7320',
    1000,
    10,
    91,
    'healthy',
    current_date + interval '20 days',
    'Demo data only.'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'DEMO-GEN-002',
    'Demo Manufacturer',
    'DG-800',
    'DEMO-SN-002',
    2022,
    640,
    800,
    400,
    1155,
    50,
    1500,
    0.8,
    '3 Phase',
    'prime',
    'Demo Engine Plus',
    'DEMO-ENG-002',
    'Demo Alternator Plus',
    'DEMO-ALT-002',
    'DSE 8610',
    1800,
    12,
    72,
    'attention',
    current_date + interval '5 days',
    'Demo data only.'
  )
on conflict (id) do update
set health_score = excluded.health_score,
    status = excluded.status,
    next_maintenance_due = excluded.next_maintenance_due,
    notes = excluded.notes;

insert into public.weekly_inspections (
  generator_id,
  site_id,
  inspection_date,
  checklist,
  overall_status,
  notes,
  approval_status
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    current_date - interval '3 days',
    '{"oil_level":{"status":"OK","notes":""},"coolant_level":{"status":"OK","notes":""},"battery_condition":{"status":"OK","notes":""},"general_condition":{"status":"OK","notes":"Demo inspection."}}',
    'healthy',
    'Demo data only.',
    'approved'
  );

insert into public.dse_readings (
  generator_id,
  reading_date,
  manual_start,
  manual_stop,
  return_to_auto,
  running_hours,
  number_of_starts,
  battery_voltage,
  coolant_temperature,
  engine_speed_rpm,
  alarm_screen,
  event_log,
  approval_status
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    current_date - interval '2 days',
    true,
    true,
    true,
    1280,
    64,
    26.4,
    82,
    1502,
    'No active alarms. Demo data.',
    'Demo event log placeholder.',
    'approved'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    current_date - interval '1 day',
    true,
    true,
    true,
    2120,
    118,
    24.9,
    88,
    1498,
    'Low coolant warning. Demo data.',
    'Demo event log placeholder.',
    'submitted'
  );

insert into public.maintenance_records (
  generator_id,
  maintenance_date,
  maintenance_type,
  completed_items,
  notes,
  approval_status
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    current_date - interval '35 days',
    'general',
    '{"overall_exhaust_line_condition":{"status":"OK","notes":""},"overall_engine_condition":{"status":"OK","notes":""},"overall_alternator_condition":{"status":"OK","notes":""}}',
    'Demo cleaning record.',
    'approved'
  );

insert into public.alarms (generator_id, severity, source, message, resolved)
values
  ('20000000-0000-0000-0000-000000000002', 'warning', 'DSE', 'Demo low coolant warning', false),
  ('20000000-0000-0000-0000-000000000001', 'info', 'Inspection', 'Demo inspection note', true);
