import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoGeneratorOptions, demoTrendData } from "@/lib/demo-data";
import { getDemoRecord, getDemoRows, getLocalDemoRows } from "@/lib/local-demo-store";
import { getModuleDefinition } from "@/lib/module-definitions";
import type { AttachmentMap, FieldDefinition, GeneratorOption, ModuleKey, UploadedAttachment } from "@/types/app";
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

type StorageBucket = NonNullable<FieldDefinition["storageBucket"]>;
type StorageTable = NonNullable<FieldDefinition["storageTable"]>;
type GeneratorPhotoAttachmentRow = {
  id: string;
  photo_type: string;
  file_path: string;
  created_at: string;
};
type GeneratorFileAttachmentRow = {
  id: string;
  file_type: string;
  file_path: string;
  created_at: string;
};

function fileNameFromPath(path: string) {
  const fileName = path.split("/").pop() ?? path;
  return fileName.replace(/^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}-/i, "");
}

function extractStoragePaths(value: unknown) {
  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }

  return [];
}

function addAttachment(attachments: AttachmentMap, attachment: UploadedAttachment) {
  attachments[attachment.fieldName] = [...(attachments[attachment.fieldName] ?? []), attachment];
}

function findStorageField(definitionFields: FieldDefinition[], storageTable: StorageTable, storageType: string) {
  return definitionFields.find((field) => field.storageTable === storageTable && (field.storageType ?? field.name) === storageType);
}

async function signedAttachment({
  bucket,
  path,
  fieldName,
  label,
  id,
  createdAt
}: {
  bucket: StorageBucket;
  path: string;
  fieldName: string;
  label: string;
  id?: string;
  createdAt?: string;
}): Promise<UploadedAttachment> {
  let url: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
    url = data?.signedUrl;
  }

  return {
    id,
    fieldName,
    label,
    bucket,
    path,
    fileName: fileNameFromPath(path),
    url,
    createdAt
  };
}

function checklistPhotoPaths(record: GenericRow, field: FieldDefinition) {
  const raw = record[field.name];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  return (field.checklistItems ?? []).flatMap((item) => {
    const itemValue = (raw as Record<string, unknown>)[item.key];
    if (!itemValue || typeof itemValue !== "object" || Array.isArray(itemValue)) {
      return [];
    }

    return extractStoragePaths((itemValue as Record<string, unknown>).photo_path).map((path) => ({
      fieldName: `${field.name}.${item.key}.photo`,
      label: `${item.label} Photo`,
      path
    }));
  });
}

export async function getModuleAttachments(moduleKey: ModuleKey, record: GenericRow | null | undefined): Promise<AttachmentMap> {
  const attachments: AttachmentMap = {};
  if (!record?.id) {
    return attachments;
  }

  const definition = getModuleDefinition(moduleKey);

  for (const field of definition.fields) {
    if (field.type === "file" && field.storageBucket && field.targetColumn) {
      const paths = extractStoragePaths(record[field.targetColumn]);
      for (const path of paths) {
        addAttachment(
          attachments,
          await signedAttachment({
            bucket: field.storageBucket,
            path,
            fieldName: field.name,
            label: field.label
          })
        );
      }
    }

    if (field.type === "checklist") {
      for (const photo of checklistPhotoPaths(record, field)) {
        addAttachment(
          attachments,
          await signedAttachment({
            bucket: "operation-attachments",
            path: photo.path,
            fieldName: photo.fieldName,
            label: photo.label
          })
        );
      }
    }
  }

  if (moduleKey !== "generators" || !isSupabaseConfigured()) {
    return attachments;
  }

  const supabase = await createSupabaseServerClient();
  const [photosResult, filesResult] = await Promise.all([
    supabase
      .from("generator_photos")
      .select("id, photo_type, file_path, created_at")
      .eq("generator_id", String(record.id))
      .order("created_at", { ascending: false }),
    supabase
      .from("generator_files")
      .select("id, file_type, file_path, created_at")
      .eq("generator_id", String(record.id))
      .order("created_at", { ascending: false })
  ]);

  const photos = (photosResult.data ?? []) as GeneratorPhotoAttachmentRow[];
  const files = (filesResult.data ?? []) as GeneratorFileAttachmentRow[];

  for (const photo of photos) {
    const field = findStorageField(definition.fields, "generator_photos", photo.photo_type);
    addAttachment(
      attachments,
      await signedAttachment({
        bucket: "generator-photos",
        path: photo.file_path,
        fieldName: field?.name ?? "generator_photos",
        label: field?.label ?? photo.photo_type,
        id: photo.id,
        createdAt: photo.created_at
      })
    );
  }

  for (const file of files) {
    const field = findStorageField(definition.fields, "generator_files", file.file_type);
    addAttachment(
      attachments,
      await signedAttachment({
        bucket: "generator-files",
        path: file.file_path,
        fieldName: field?.name ?? "generator_files",
        label: field?.label ?? file.file_type,
        id: file.id,
        createdAt: file.created_at
      })
    );
  }

  return attachments;
}

export async function getGeneratorOptions(): Promise<GeneratorOption[]> {
  if (!isSupabaseConfigured()) {
    const localGenerators = await getLocalDemoRows("generators");
    const localOptions = localGenerators.map((row) => ({
      id: String(row.id),
      label: `${row.generator_id ?? "Generator"} - ${row.manufacturer ?? "Unknown"} ${row.model ?? ""}`.trim()
    }));

    return [...localOptions, ...demoGeneratorOptions];
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
    return { rows: await getDemoRows(moduleKey), isDemo: true };
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
    const row = await getDemoRecord(moduleKey, id);
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
    const generators = await getDemoRows("generators");
    const alarms = await getDemoRows("alarms");
    const inspections = await getDemoRows("weekly-inspections");

    return {
      isDemo: true,
      stats: {
        totalGenerators: generators.length,
        maintenanceDue: 1,
        latestAlarms: alarms.length,
        latestInspections: inspections.length,
        averageHealthScore: 82
      },
      latestAlarms: alarms,
      latestInspections: inspections,
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
