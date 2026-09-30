begin;

alter table public.dse_readings
  add column if not exists fuel_level_liters numeric,
  add column if not exists fuel_level_percentage numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dse_readings_fuel_level_liters_check'
      and conrelid = 'public.dse_readings'::regclass
  ) then
    alter table public.dse_readings
      add constraint dse_readings_fuel_level_liters_check check (fuel_level_liters >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'dse_readings_fuel_level_percentage_check'
      and conrelid = 'public.dse_readings'::regclass
  ) then
    alter table public.dse_readings
      add constraint dse_readings_fuel_level_percentage_check check (fuel_level_percentage between 0 and 100);
  end if;
end $$;

commit;
