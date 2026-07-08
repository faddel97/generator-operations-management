-- One-time promotion from demo/local mode into the real Supabase database.
-- Run this after supabase/schema.sql.
-- It does not delete existing records. It inserts or updates the demo-phase rows
-- so they become normal database records that the deployed app can use.

begin;

insert into public.sites (id, name, code, address, region)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Initial Operations Site',
    'GOM-BASE',
    'Initial generator operations site',
    'Eastern Province'
  )
on conflict (id) do update
set name = excluded.name,
    code = excluded.code,
    address = excluded.address,
    region = excluded.region,
    updated_at = now();

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
    (current_date + interval '20 days')::date,
    'Promoted from demo phase.'
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
    (current_date + interval '5 days')::date,
    'Promoted from demo phase.'
  ),
  (
    '20000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    '1234',
    '1234455',
    '123',
    '53453',
    234,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'prime',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    100,
    'healthy',
    '2026-07-04',
    'Promoted from local test data.'
  ),
  (
    '20000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000001',
    '12',
    '23',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'prime',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    100,
    'healthy',
    '2026-07-04',
    'Promoted from local test data.'
  ),
  (
    '20000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000001',
    'TEST-GEN-LOCAL-001',
    'Local Test Manufacturer',
    'LT-500',
    null,
    null,
    null,
    500,
    null,
    null,
    null,
    null,
    null,
    null,
    'standby',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    100,
    'healthy',
    '2026-07-04',
    'Promoted from local test data.'
  )
on conflict (generator_id) do update
set site_id = excluded.site_id,
    manufacturer = excluded.manufacturer,
    model = excluded.model,
    serial_number = excluded.serial_number,
    year = excluded.year,
    rated_power_kw = excluded.rated_power_kw,
    rated_power_kva = excluded.rated_power_kva,
    rated_voltage = excluded.rated_voltage,
    rated_current = excluded.rated_current,
    frequency = excluded.frequency,
    rpm = excluded.rpm,
    power_factor = excluded.power_factor,
    phase = excluded.phase,
    duty = excluded.duty,
    engine_model = excluded.engine_model,
    engine_serial_number = excluded.engine_serial_number,
    alternator_model = excluded.alternator_model,
    alternator_serial_number = excluded.alternator_serial_number,
    dse_model = excluded.dse_model,
    fuel_tank_capacity = excluded.fuel_tank_capacity,
    operation_time = excluded.operation_time,
    health_score = excluded.health_score,
    status = excluded.status,
    next_maintenance_due = excluded.next_maintenance_due,
    notes = excluded.notes,
    updated_at = now();

insert into public.weekly_inspections (
  id,
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
    '30000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    '10000000-0000-0000-0000-000000000001',
    current_date - interval '3 days',
    '{
      "oil_level": {"status": "OK", "notes": ""},
      "oil_leak": {"status": "OK", "notes": ""},
      "fuel_leak": {"status": "OK", "notes": ""},
      "coolant_level": {"status": "OK", "notes": ""},
      "coolant_leak": {"status": "OK", "notes": ""},
      "coolant_condition": {"status": "OK", "notes": ""},
      "radiator_condition": {"status": "OK", "notes": ""},
      "battery_condition": {"status": "OK", "notes": ""},
      "battery_corrosion": {"status": "OK", "notes": ""},
      "air_filter": {"status": "OK", "notes": ""},
      "fuel_filter": {"status": "OK", "notes": ""},
      "belts": {"status": "OK", "notes": ""},
      "hoses": {"status": "OK", "notes": ""},
      "exhaust": {"status": "OK", "notes": ""},
      "generator_cleanliness": {"status": "OK", "notes": ""},
      "room_cleanliness": {"status": "OK", "notes": ""},
      "general_condition": {"status": "OK", "notes": ""}
    }'::jsonb,
    'healthy',
    'Promoted from demo phase.',
    'approved'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    site_id = excluded.site_id,
    inspection_date = excluded.inspection_date,
    checklist = excluded.checklist,
    overall_status = excluded.overall_status,
    notes = excluded.notes,
    approval_status = excluded.approval_status,
    updated_at = now();

insert into public.dse_readings (
  id,
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
    '40000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    current_date - interval '2 days',
    true,
    true,
    true,
    1280,
    64,
    26.4,
    82,
    1502,
    'No active alarms. Promoted from demo phase.',
    'Initial promoted DSE reading.',
    'approved'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    (select id from public.generators where generator_id = 'DEMO-GEN-002'),
    current_date - interval '1 day',
    true,
    true,
    true,
    2120,
    118,
    24.9,
    88,
    1498,
    'Low coolant warning. Promoted from demo phase.',
    'Initial promoted DSE reading.',
    'submitted'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    reading_date = excluded.reading_date,
    manual_start = excluded.manual_start,
    manual_stop = excluded.manual_stop,
    return_to_auto = excluded.return_to_auto,
    running_hours = excluded.running_hours,
    number_of_starts = excluded.number_of_starts,
    battery_voltage = excluded.battery_voltage,
    coolant_temperature = excluded.coolant_temperature,
    engine_speed_rpm = excluded.engine_speed_rpm,
    alarm_screen = excluded.alarm_screen,
    event_log = excluded.event_log,
    approval_status = excluded.approval_status,
    updated_at = now();

insert into public.ats_tests (
  id,
  generator_id,
  test_date,
  checklist,
  generator_started,
  ats_transfer,
  ats_return,
  approval_status,
  notes
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    current_date - interval '10 days',
    '{}'::jsonb,
    true,
    true,
    true,
    'approved',
    'Promoted from demo phase.'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    test_date = excluded.test_date,
    checklist = excluded.checklist,
    generator_started = excluded.generator_started,
    ats_transfer = excluded.ats_transfer,
    ats_return = excluded.ats_return,
    approval_status = excluded.approval_status,
    notes = excluded.notes,
    updated_at = now();

insert into public.ats_manual_operations (
  id,
  generator_id,
  operation_date,
  case_type,
  actions_completed,
  notes,
  photo_paths,
  approval_status
)
values
  (
    '51000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-002'),
    current_date - interval '18 days',
    'stuck_on_mains',
    '{}'::jsonb,
    'Promoted from demo emergency operation record.',
    array[]::text[],
    'submitted'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    operation_date = excluded.operation_date,
    case_type = excluded.case_type,
    actions_completed = excluded.actions_completed,
    notes = excluded.notes,
    photo_paths = excluded.photo_paths,
    approval_status = excluded.approval_status,
    updated_at = now();

insert into public.maintenance_records (
  id,
  generator_id,
  maintenance_date,
  maintenance_type,
  completed_items,
  picture_paths,
  notes,
  approval_status
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    current_date - interval '35 days',
    'general',
    '{
      "overall_exhaust_line_condition": {"status": "OK", "notes": ""},
      "overall_engine_condition": {"status": "OK", "notes": ""},
      "overall_alternator_condition": {"status": "OK", "notes": ""}
    }'::jsonb,
    array[]::text[],
    'Promoted from demo maintenance record.',
    'approved'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    maintenance_date = excluded.maintenance_date,
    maintenance_type = excluded.maintenance_type,
    completed_items = excluded.completed_items,
    picture_paths = excluded.picture_paths,
    notes = excluded.notes,
    approval_status = excluded.approval_status,
    updated_at = now();

insert into public.load_tests (
  id,
  generator_id,
  test_date,
  load_level,
  kw,
  coolant_temperature,
  approval_status,
  notes
)
values
  (
    '70000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    current_date - interval '44 days',
    80,
    320,
    84,
    'approved',
    'Promoted from demo phase.'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    test_date = excluded.test_date,
    load_level = excluded.load_level,
    kw = excluded.kw,
    coolant_temperature = excluded.coolant_temperature,
    approval_status = excluded.approval_status,
    notes = excluded.notes,
    updated_at = now();

insert into public.vibration_tests (
  id,
  generator_id,
  test_date,
  trend_analysis_notes,
  attachment_paths,
  approval_status
)
values
  (
    '80000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-002'),
    current_date - interval '60 days',
    'Promoted demo trend note.',
    array[]::text[],
    'submitted'
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    test_date = excluded.test_date,
    trend_analysis_notes = excluded.trend_analysis_notes,
    attachment_paths = excluded.attachment_paths,
    approval_status = excluded.approval_status,
    updated_at = now();

insert into public.alarms (
  id,
  generator_id,
  alarm_date,
  severity,
  source,
  message,
  resolved
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-002'),
    now() - interval '1 day',
    'warning',
    'DSE',
    'Promoted low coolant warning',
    false
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    alarm_date = excluded.alarm_date,
    severity = excluded.severity,
    source = excluded.source,
    message = excluded.message,
    resolved = excluded.resolved,
    updated_at = now();

insert into public.event_logs (
  id,
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
  details
)
values
  (
    '91000000-0000-0000-0000-000000000001',
    (select id from public.generators where generator_id = 'DEMO-GEN-001'),
    now() - interval '1 day',
    'event_logs',
    'insert',
    'event_logs',
    '91000000-0000-0000-0000-000000000001',
    'Demo event log',
    'Promoted demo event log row by Demo Admin.',
    jsonb_build_object(
      'action', 'insert',
      'table', 'event_logs',
      'entity_id', '91000000-0000-0000-0000-000000000001',
      'entity_label', 'Demo event log',
      'actor', jsonb_build_object('name', 'Demo Admin', 'email', 'demo.admin@gom.local', 'role', 'admin')
    ),
    null,
    'demo.admin@gom.local',
    'Demo Admin',
    'admin',
    array['message']::text[],
    null,
    jsonb_build_object('message', 'Promoted demo event log row.'),
    jsonb_build_object('source', 'promoted_demo_phase')
  )
on conflict (id) do update
set generator_id = excluded.generator_id,
    event_date = excluded.event_date,
    event_type = excluded.event_type,
    event_action = excluded.event_action,
    entity_table = excluded.entity_table,
    entity_id = excluded.entity_id,
    entity_label = excluded.entity_label,
    message = excluded.message,
    raw_payload = excluded.raw_payload,
    actor_email = excluded.actor_email,
    actor_name = excluded.actor_name,
    actor_role = excluded.actor_role,
    changed_fields = excluded.changed_fields,
    before_data = excluded.before_data,
    after_data = excluded.after_data,
    details = excluded.details,
    updated_at = now();

insert into public.reports (
  id,
  report_type,
  title,
  period_start,
  period_end,
  filters,
  generated_payload
)
values
  (
    '92000000-0000-0000-0000-000000000001',
    'weekly',
    'Initial weekly report',
    current_date - interval '7 days',
    current_date,
    '{}'::jsonb,
    '{"source":"promoted_demo_phase"}'::jsonb
  )
on conflict (id) do update
set report_type = excluded.report_type,
    title = excluded.title,
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    filters = excluded.filters,
    generated_payload = excluded.generated_payload,
    updated_at = now();

commit;
