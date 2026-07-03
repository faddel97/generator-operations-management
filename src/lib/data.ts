import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoGeneratorOptions, demoModuleRows, demoTrendData } from "@/lib/demo-data";
import { getModuleDefinition } from "@/lib/module-definitions";
import type { GeneratorOption, ModuleKey } from "@/types/app";
import type { GenericRow } from "@/types/database";

type QueryError = { message: string };

type DynamicFilterBuilder<T> = {
  eq(column: string, value: string): DynamicFilterBuilder<T>;
  select(columns?: string): DynamicFilterBuilder<T>;
  single(): Promise<{ data: T | null; error: QueryError | null }>;
  maybeSingle(): Promise<{ data: T | null; error: QueryError | null }>;
};

type DynamicSelectBuilder<T> = {
  select(columns?: string): DynamicSelectBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): DynamicSelectBuilder<T>;
  limit(count: number): Promise<{ data: T[] | null; error: QueryError | null }>;
  eq(column: string, value: string): DynamicFilterBuilder<T>;
  maybeSingle(): Promise<{ data: T | null; error: QueryError | null }>;
};

type DynamicTable<T> = {
  select(columns?: string): DynamicSelectBuilder<T>;
  insert(values: Record<string, unknown>): {
    select(columns?: string): {
      single(): Promise<{ data: T | null; error: QueryError | null }>;
    };
  };
  update(values: Record<string, unknown>): DynamicFilterBuilder<T>;
  delete(): DynamicFilterBuilder<T>;
};

export type DynamicSupabase = {
  from<T extends GenericRow = GenericRow>(table: string): DynamicTable<T>;
};

export type DashboardData = {
  isDemo: boolean;
  stats: {
    totalGenerators: number;
    maintenanceDue: number;
    latestAlarms: number;
    latestInspections: number;
    averageHealthScore: number;
  };
  latestAlarms: GenericRow[];
  latestInspections: GenericRow[];
  trends: typeof demoTrendData;
};

export async function getDynamicSupabase() {
  const supabase = await createSupabaseServerClient();
  return supabase as unknown as DynamicSupabase;
}

export async function getGeneratorOptions(): Promise<GeneratorOption[]> {
  if (!isSupabaseConfigured()) {
    return demoGeneratorOptions;
  }

  const supabase = await getDynamicSupabase();
  const { data, error } = await supabase
    .from("generators")
    .select("id, generator_id, manufacturer, model")
    .order("generator_id", { ascending: true })
    .limit(500);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    label: `${row.generator_id ?? "Generator"} - ${row.manufacturer ?? "Unknown"} ${row.model ?? ""}`.trim()
  }));
}

export async function getGeneratorLabelMap() {
  const options = await getGeneratorOptions();
  return new Map(options.map((option) => [option.id, option.label]));
}

export async function getModuleRows(moduleKey: ModuleKey): Promise<{ rows: GenericRow[]; isDemo: boolean; error?: string }> {
  const definition = getModuleDefinition(moduleKey);

  if (!isSupabaseConfigured()) {
    return { rows: demoModuleRows[moduleKey] ?? [], isDemo: true };
  }

  const supabase = await getDynamicSupabase();
  const orderColumn = definition.dateField ?? "created_at";
  const { data, error } = await supabase
    .from(definition.table)
    .select("*")
    .order(orderColumn, { ascending: false })
    .limit(100);

  if (error) {
    return { rows: [], isDemo: false, error: error.message };
  }

  return { rows: data ?? [], isDemo: false };
}

export async function getModuleRecord(moduleKey: ModuleKey, id: string) {
  if (!isSupabaseConfigured()) {
    const row = demoModuleRows[moduleKey]?.find((item) => item.id === id) ?? null;
    return { row, isDemo: true };
  }

  const definition = getModuleDefinition(moduleKey);
  const supabase = await getDynamicSupabase();
  const { data, error } = await supabase.from(definition.table).select("*").eq("id", id).maybeSingle();

  if (error) {
    return { row: null, isDemo: false, error: error.message };
  }

  return { row: data, isDemo: false };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return {
      isDemo: true,
      stats: {
        totalGenerators: demoModuleRows.generators.length,
        maintenanceDue: 1,
        latestAlarms: demoModuleRows.alarms.length,
        latestInspections: demoModuleRows["weekly-inspections"].length,
        averageHealthScore: 82
      },
      latestAlarms: demoModuleRows.alarms,
      latestInspections: demoModuleRows["weekly-inspections"],
      trends: demoTrendData
    };
  }

  const supabase = await getDynamicSupabase();
  const [generatorsResult, alarmsResult, inspectionsResult, readingsResult] = await Promise.all([
    supabase.from("generators").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("alarms").select("*").order("alarm_date", { ascending: false }).limit(8),
    supabase.from("weekly_inspections").select("*").order("inspection_date", { ascending: false }).limit(8),
    supabase.from("dse_readings").select("*").order("reading_date", { ascending: true }).limit(24)
  ]);

  const generators = generatorsResult.data ?? [];
  const alarms = alarmsResult.data ?? [];
  const inspections = inspectionsResult.data ?? [];
  const readings = readingsResult.data ?? [];
  const dueCutoff = Date.now() + 30 * 86400000;
  const healthScores = generators.map((row) => Number(row.health_score)).filter((value) => !Number.isNaN(value));

  return {
    isDemo: false,
    stats: {
      totalGenerators: generators.length,
      maintenanceDue: generators.filter((row) => {
        const dueDate = typeof row.next_maintenance_due === "string" ? new Date(row.next_maintenance_due).getTime() : Number.POSITIVE_INFINITY;
        return dueDate <= dueCutoff;
      }).length,
      latestAlarms: alarms.filter((row) => row.resolved !== true).length,
      latestInspections: inspections.length,
      averageHealthScore: healthScores.length
        ? Math.round(healthScores.reduce((sum, value) => sum + value, 0) / healthScores.length)
        : 0
    },
    latestAlarms: alarms,
    latestInspections: inspections,
    trends: readings.map((row, index) => ({
      period: typeof row.reading_date === "string" ? row.reading_date.slice(5, 10) : `R${index + 1}`,
      runningHours: Number(row.running_hours ?? 0),
      batteryVoltage: Number(row.battery_voltage ?? 0),
      coolantTemperature: Number(row.coolant_temperature ?? 0),
      starts: Number(row.number_of_starts ?? 0)
    }))
  };
}
