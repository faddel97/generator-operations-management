import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { demoModuleRows } from "@/lib/demo-data";
import { getModuleDefinition } from "@/lib/module-definitions";
import type { ModuleKey } from "@/types/app";
import type { GenericRow } from "@/types/database";

type DemoStore = Partial<Record<ModuleKey, GenericRow[]>>;

const demoStorePath = path.join(process.cwd(), ".local-data", "demo-records.json");

async function readDemoStore(): Promise<DemoStore> {
  try {
    const raw = await fs.readFile(demoStorePath, "utf8");
    const parsed = JSON.parse(raw) as DemoStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeDemoStore(store: DemoStore) {
  await fs.mkdir(path.dirname(demoStorePath), { recursive: true });
  await fs.writeFile(demoStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function getLocalDemoRows(moduleKey: ModuleKey) {
  const store = await readDemoStore();
  return store[moduleKey] ?? [];
}

export async function getDemoRows(moduleKey: ModuleKey) {
  const localRows = await getLocalDemoRows(moduleKey);
  return [...localRows, ...(demoModuleRows[moduleKey] ?? [])];
}

export async function getDemoRecord(moduleKey: ModuleKey, id: string) {
  const rows = await getDemoRows(moduleKey);
  return rows.find((row) => row.id === id) ?? null;
}

export async function saveLocalDemoRecord(moduleKey: ModuleKey, payload: Record<string, unknown>, recordId?: string) {
  const store = await readDemoStore();
  const rows = store[moduleKey] ?? [];
  const now = new Date().toISOString();
  const definition = getModuleDefinition(moduleKey);
  const existingIndex = recordId ? rows.findIndex((row) => row.id === recordId) : -1;

  const nextRecord: GenericRow = {
    ...(existingIndex >= 0 ? rows[existingIndex] : {}),
    ...payload,
    id: recordId || `local-${moduleKey}-${crypto.randomUUID()}`,
    created_at: existingIndex >= 0 ? rows[existingIndex].created_at : now,
    updated_at: now
  } as GenericRow;

  if (definition.reviewable && !nextRecord.approval_status) {
    nextRecord.approval_status = "submitted";
  }

  if (moduleKey === "generators") {
    nextRecord.status = nextRecord.status ?? "healthy";
    nextRecord.health_score = nextRecord.health_score ?? 100;
    nextRecord.duty = nextRecord.duty ?? "standby";
  }

  store[moduleKey] =
    existingIndex >= 0
      ? rows.map((row, index) => (index === existingIndex ? nextRecord : row))
      : [nextRecord, ...rows];

  await writeDemoStore(store);
  return nextRecord;
}

export async function deleteLocalDemoRecord(moduleKey: ModuleKey, recordId: string) {
  const store = await readDemoStore();
  const rows = store[moduleKey] ?? [];
  store[moduleKey] = rows.filter((row) => row.id !== recordId);
  await writeDemoStore(store);
}

export async function updateLocalDemoRecord(moduleKey: ModuleKey, recordId: string, payload: Record<string, unknown>) {
  const store = await readDemoStore();
  const rows = store[moduleKey] ?? [];
  const existingIndex = rows.findIndex((row) => row.id === recordId);

  if (existingIndex < 0) {
    return null;
  }

  const nextRecord = {
    ...rows[existingIndex],
    ...payload,
    updated_at: new Date().toISOString()
  } as GenericRow;

  store[moduleKey] = rows.map((row, index) => (index === existingIndex ? nextRecord : row));
  await writeDemoStore(store);
  return nextRecord;
}
