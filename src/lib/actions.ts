"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireAuthenticated } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDynamicSupabase, type DynamicSupabase } from "@/lib/data";
import { getModuleDefinition } from "@/lib/module-definitions";
import { hasRole } from "@/lib/permissions";
import { getAbsoluteUrl } from "@/lib/url";
import type { FieldDefinition, ModuleKey } from "@/types/app";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseScalarField(formData: FormData, field: FieldDefinition) {
  if (field.type === "checkbox") {
    return formData.get(field.name) === "on";
  }

  const raw = formString(formData, field.name);
  if (raw === "") {
    return null;
  }

  if (field.type === "number") {
    const numberValue = Number(raw);
    return Number.isNaN(numberValue) ? null : numberValue;
  }

  return raw;
}

function parseChecklist(formData: FormData, field: FieldDefinition) {
  const result: Record<string, { status: string; notes: string }> = {};

  for (const item of field.checklistItems ?? []) {
    result[item.key] = {
      status: formString(formData, `${field.name}.${item.key}.status`) || "N/A",
      notes: formString(formData, `${field.name}.${item.key}.notes`)
    };
  }

  return result;
}

function parseProcedure(formData: FormData, field: FieldDefinition) {
  const result: Record<string, boolean> = {};

  for (const item of field.checklistItems ?? []) {
    result[item.key] = formData.get(`${field.name}.${item.key}`) === "on";
  }

  return result;
}

function isFileEntry(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "size" in value && value.size > 0;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

async function uploadNamedFile({
  formData,
  fieldName,
  moduleKey,
  recordId
}: {
  formData: FormData;
  fieldName: string;
  moduleKey: string;
  recordId: string;
}) {
  const entry = formData.get(fieldName);
  if (!entry || !isFileEntry(entry)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const path = `${moduleKey}/${recordId}/${crypto.randomUUID()}-${safeFileName(entry.name)}`;
  const { error } = await supabase.storage.from("operation-attachments").upload(path, entry, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

async function uploadFieldFiles({
  formData,
  field,
  moduleKey,
  recordId,
  userId
}: {
  formData: FormData;
  field: FieldDefinition;
  moduleKey: string;
  recordId: string;
  userId: string | null;
}) {
  if (!field.storageBucket) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as DynamicSupabase;
  const entries = formData.getAll(field.name).filter(isFileEntry);
  const uploadedPaths: string[] = [];

  for (const file of entries) {
    const path = `${moduleKey}/${recordId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(field.storageBucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      throw new Error(error.message);
    }

    uploadedPaths.push(path);

    if (field.storageTable === "generator_photos") {
      const insertResult = await db.from("generator_photos").insert({
        generator_id: recordId,
        photo_type: field.storageType ?? field.name,
        file_path: path,
        uploaded_by: userId
      }).select("*").single();

      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
    }

    if (field.storageTable === "generator_files") {
      const insertResult = await db.from("generator_files").insert({
        generator_id: recordId,
        file_type: field.storageType ?? field.name,
        file_path: path,
        uploaded_by: userId
      }).select("*").single();

      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
    }
  }

  return uploadedPaths;
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add .env.local values before signing in.");
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add .env.local values before signing up.");
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const fullName = formString(formData, "full_name");
  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const emailRedirectTo = getAbsoluteUrl("/auth/callback?next=/dashboard", requestHeaders.get("origin"));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?message=check-email");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function saveModuleRecordAction(formData: FormData) {
  const moduleKey = formString(formData, "moduleKey") as ModuleKey;
  const recordId = formString(formData, "recordId");
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Demo preview is read-only.");
  }

  const allowedRoles = recordId ? definition.updateRoles : definition.createRoles;
  if (!hasRole(context.role, allowedRoles)) {
    throw new Error("You do not have permission to save this record.");
  }

  const payload: Record<string, unknown> = {};

  for (const field of definition.fields) {
    if (field.type === "file") {
      continue;
    }

    if (field.type === "checklist") {
      payload[field.name] = parseChecklist(formData, field);
      continue;
    }

    if (field.type === "procedure") {
      payload[field.name] = parseProcedure(formData, field);
      continue;
    }

    payload[field.name] = parseScalarField(formData, field);
  }

  if (context.userId) {
    payload.created_by = context.userId;
    if (definition.reviewable) {
      payload.submitted_by = context.userId;
    }
  }

  if (definition.reviewable && !payload.approval_status) {
    payload.approval_status = "submitted";
  }

  const supabase = await getDynamicSupabase();
  const saved = recordId
    ? await supabase.from(definition.table).update(payload).eq("id", recordId).select("*").single()
    : await supabase.from(definition.table).insert(payload).select("*").single();

  if (saved.error || !saved.data?.id) {
    throw new Error(saved.error?.message ?? "Unable to save record.");
  }

  const savedId = String(saved.data.id);
  const fileColumnUpdates: Record<string, unknown> = {};

  for (const field of definition.fields.filter((item) => item.type === "file")) {
    const uploadedPaths = await uploadFieldFiles({
      formData,
      field,
      moduleKey,
      recordId: savedId,
      userId: context.userId
    });

    if (field.targetColumn && uploadedPaths.length > 0) {
      fileColumnUpdates[field.targetColumn] = field.multiple ? uploadedPaths : uploadedPaths[0];
    }
  }

  for (const field of definition.fields.filter((item) => item.type === "checklist")) {
    const checklist = payload[field.name];
    if (!checklist || typeof checklist !== "object" || Array.isArray(checklist)) {
      continue;
    }

    let hasChecklistPhotos = false;
    const nextChecklist = { ...(checklist as Record<string, Record<string, unknown>>) };

    for (const item of field.checklistItems ?? []) {
      const photoPath = await uploadNamedFile({
        formData,
        fieldName: `${field.name}.${item.key}.photo`,
        moduleKey,
        recordId: savedId
      });

      if (photoPath) {
        nextChecklist[item.key] = {
          ...(nextChecklist[item.key] ?? {}),
          photo_path: photoPath
        };
        hasChecklistPhotos = true;
      }
    }

    if (hasChecklistPhotos) {
      fileColumnUpdates[field.name] = nextChecklist;
    }
  }

  if (Object.keys(fileColumnUpdates).length > 0) {
    const updateResult = await supabase.from(definition.table).update(fileColumnUpdates).eq("id", savedId).select("*").single();
    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }
  }

  revalidatePath(definition.path);
  redirect(definition.path);
}

export async function deleteModuleRecordAction(formData: FormData) {
  const moduleKey = formString(formData, "moduleKey") as ModuleKey;
  const recordId = formString(formData, "recordId");
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Demo preview is read-only.");
  }

  if (!recordId || !hasRole(context.role, definition.deleteRoles)) {
    throw new Error("You do not have permission to delete this record.");
  }

  const supabase = await getDynamicSupabase();
  const result = await supabase.from(definition.table).delete().eq("id", recordId).select("*").single();

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath(definition.path);
}

export async function reviewRecordAction(formData: FormData) {
  const moduleKey = formString(formData, "moduleKey") as ModuleKey;
  const recordId = formString(formData, "recordId");
  const status = formString(formData, "status");
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Demo preview is read-only.");
  }

  if (!recordId || !hasRole(context.role, ["admin", "supervisor"])) {
    throw new Error("Only admins and supervisors can review records.");
  }

  if (!["approved", "rejected", "submitted"].includes(status)) {
    throw new Error("Invalid review status.");
  }

  const supabase = await getDynamicSupabase();
  const result = await supabase
    .from(definition.table)
    .update({ approval_status: status })
    .eq("id", recordId)
    .select("*")
    .single();

  if (result.error) {
    throw new Error(result.error.message);
  }

  await supabase.from("approvals").insert({
    target_table: definition.table,
    target_id: recordId,
    status,
    reviewed_by: context.userId,
    reviewed_at: new Date().toISOString(),
    created_by: context.userId
  });

  revalidatePath(definition.path);
}
