import Link from "next/link";

import { AttachmentList } from "@/components/module/attachment-list";
import { saveModuleRecordAction } from "@/lib/actions";
import { humanize, todayIsoDate } from "@/lib/format";
import type { AttachmentMap, FieldDefinition, GeneratorOption, ModuleDefinition } from "@/types/app";
import type { GenericRow } from "@/types/database";
import { SubmitButton } from "@/components/ui/submit-button";

function fieldValue(record: GenericRow | null | undefined, field: FieldDefinition) {
  const value = record?.[field.name];
  if (typeof value === "string" || typeof value === "number") {
    return String(value).slice(0, field.type === "date" ? 10 : undefined);
  }

  if (field.type === "date") {
    return todayIsoDate();
  }

  if (field.name === "approval_status") {
    return "submitted";
  }

  if (field.name === "status" || field.name === "overall_status") {
    return "healthy";
  }

  if (field.name === "health_score") {
    return "100";
  }

  return "";
}

function groupBySection(fields: FieldDefinition[]) {
  const groups = new Map<string, FieldDefinition[]>();

  fields.forEach((field) => {
    const key = field.section ?? "Details";
    groups.set(key, [...(groups.get(key) ?? []), field]);
  });

  return Array.from(groups.entries());
}

function getChecklistValue(record: GenericRow | null | undefined, fieldName: string, itemKey: string, key: "status" | "notes") {
  const raw = record?.[fieldName];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return "";
  }

  const item = (raw as Record<string, Record<string, unknown>>)[itemKey];
  const value = item?.[key];
  return typeof value === "string" ? value : "";
}

function isProcedureChecked(record: GenericRow | null | undefined, fieldName: string, itemKey: string) {
  const raw = record?.[fieldName];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return false;
  }

  return Boolean((raw as Record<string, boolean>)[itemKey]);
}

function FieldControl({
  field,
  record,
  generatorOptions,
  attachments
}: {
  field: FieldDefinition;
  record?: GenericRow | null;
  generatorOptions: GeneratorOption[];
  attachments: AttachmentMap;
}) {
  const commonClass = "form-input";
  const defaultValue = fieldValue(record, field);

  if (field.type === "textarea") {
    return <textarea name={field.name} rows={4} required={field.required} defaultValue={defaultValue} className={commonClass} placeholder={field.placeholder} />;
  }

  if (field.type === "select") {
    return (
      <select name={field.name} required={field.required} defaultValue={defaultValue} className={commonClass}>
        <option value="">Select...</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "generator") {
    return (
      <select name={field.name} required={field.required} defaultValue={defaultValue} className={commonClass}>
        <option value="">Select generator...</option>
        {generatorOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <input name={field.name} type="checkbox" defaultChecked={Boolean(record?.[field.name])} className="h-4 w-4 accent-teal-700" />
        Completed
      </label>
    );
  }

  if (field.type === "file") {
    const fieldAttachments = attachments[field.name] ?? [];

    return (
      <div>
        <input
          name={field.name}
          type="file"
          accept={field.accept}
          multiple={field.multiple}
          className="block w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <AttachmentList attachments={fieldAttachments} compact />
      </div>
    );
  }

  if (field.type === "checklist") {
    const sections = new Map<string, NonNullable<FieldDefinition["checklistItems"]>>();
    (field.checklistItems ?? []).forEach((item) => {
      const section = item.section ?? "Checklist";
      sections.set(section, [...(sections.get(section) ?? []), item]);
    });

    return (
      <div className="space-y-4">
        {Array.from(sections.entries()).map(([section, items]) => (
          <div key={section} className="rounded-md border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">{section}</div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.key} className="grid gap-3 px-4 py-3 md:grid-cols-[180px_140px_1fr_180px] md:items-center">
                  <div className="text-sm font-medium text-slate-800">{item.label}</div>
                  {item.control === "text" ? (
                    <input
                      name={`${field.name}.${item.key}.status`}
                      defaultValue={getChecklistValue(record, field.name, item.key, "status") || item.defaultValue || ""}
                      className={commonClass}
                    />
                  ) : (
                    <select name={`${field.name}.${item.key}.status`} defaultValue={getChecklistValue(record, field.name, item.key, "status") || item.defaultValue || "OK"} className={commonClass}>
                      {(item.options ?? field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <input name={`${field.name}.${item.key}.notes`} defaultValue={getChecklistValue(record, field.name, item.key, "notes")} className={commonClass} placeholder="Notes" />
                  <div>
                    <input name={`${field.name}.${item.key}.photo`} type="file" accept="image/*" className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-900 file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
                    <AttachmentList attachments={attachments[`${field.name}.${item.key}.photo`] ?? []} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (field.type === "procedure") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(field.checklistItems ?? []).map((item) => (
          <label key={`${field.name}.${item.key}`} className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input name={`${field.name}.${item.key}`} type="checkbox" defaultChecked={isProcedureChecked(record, field.name, item.key)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700" />
            <span>
              {item.section ? <span className="block text-xs font-semibold uppercase text-slate-500">{item.section}</span> : null}
              {item.label}
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      name={field.name}
      type={field.type === "number" || field.type === "date" ? field.type : "text"}
      required={field.required}
      defaultValue={defaultValue}
      min={field.min}
      max={field.max}
      step={field.step}
      className={commonClass}
      placeholder={field.placeholder}
    />
  );
}

export function ModuleForm({
  definition,
  generatorOptions,
  record,
  attachments = {}
}: {
  definition: ModuleDefinition;
  generatorOptions: GeneratorOption[];
  record?: GenericRow | null;
  attachments?: AttachmentMap;
}) {
  const sections = groupBySection(definition.fields);

  return (
    <form action={saveModuleRecordAction} className="space-y-5">
      <input type="hidden" name="moduleKey" value={definition.key} />
      {record?.id ? <input type="hidden" name="recordId" value={String(record.id)} /> : null}
      {sections.map(([section, fields]) => (
        <section key={section} className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">{section}</h3>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {fields.map((field) => {
              const isWide = ["textarea", "checklist", "procedure", "file"].includes(field.type);
              return (
                <div key={field.name} className={isWide ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                    {field.label}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </label>
                  <FieldControl field={field} record={record} generatorOptions={generatorOptions} attachments={attachments} />
                  {field.helper ? <p className="mt-1.5 text-xs text-slate-500">{field.helper}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={definition.path} className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Cancel
        </Link>
        <SubmitButton>{record?.id ? `Update ${humanize(definition.singularTitle)}` : `Save ${humanize(definition.singularTitle)}`}</SubmitButton>
      </div>
    </form>
  );
}
