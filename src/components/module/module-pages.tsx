import { notFound } from "next/navigation";

import { DemoBanner } from "@/components/demo-banner";
import { ModuleForm } from "@/components/module/module-form";
import { ModuleTable } from "@/components/module/module-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getGeneratorLabelMap, getGeneratorOptions, getModuleRecord, getModuleRows } from "@/lib/data";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import { getModuleDefinition } from "@/lib/module-definitions";
import { hasRole } from "@/lib/permissions";
import { requireAuthenticated } from "@/lib/auth";
import type { ModuleKey } from "@/types/app";

function actionErrorMessage(actionError?: string) {
  if (actionError === "delete-failed") {
    return "Delete failed because the database rejected the request. Run the latest Supabase repair SQL, then try again.";
  }

  return null;
}

export async function ModuleIndexPage({ moduleKey, actionError }: { moduleKey: ModuleKey; actionError?: string }) {
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();
  const [{ rows, isDemo, error }, generatorMap] = await Promise.all([getModuleRows(moduleKey), getGeneratorLabelMap()]);
  const actionErrorText = actionErrorMessage(actionError);

  return (
    <div className="space-y-5">
      <PageHeader
        title={definition.title}
        description={definition.description}
        addHref={`${definition.path}/new`}
        addLabel={definition.addLabel}
        role={context.role}
        allowedRoles={definition.createRoles}
      />
      {isDemo ? <DemoBanner /> : null}
      {actionErrorText ? <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{actionErrorText}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <ModuleTable definition={definition} rows={rows} context={context} generatorMap={generatorMap} />
    </div>
  );
}

export async function ModuleNewPage({ moduleKey }: { moduleKey: ModuleKey }) {
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();
  const generatorOptions = await getGeneratorOptions();

  if (!hasRole(context.role, definition.createRoles)) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">Your role can view this module but cannot create new records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`New ${definition.singularTitle}`} description={definition.description} />
      {context.isDemoMode ? <DemoBanner /> : null}
      <ModuleForm definition={definition} generatorOptions={generatorOptions} />
    </div>
  );
}

export async function ModuleEditPage({ moduleKey, id }: { moduleKey: ModuleKey; id: string }) {
  const definition = getModuleDefinition(moduleKey);
  const context = await requireAuthenticated();
  const [{ row, isDemo, error }, generatorOptions] = await Promise.all([getModuleRecord(moduleKey, id), getGeneratorOptions()]);

  if (!row) {
    notFound();
  }

  if (!hasRole(context.role, definition.updateRoles)) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">Your role can view this module but cannot edit records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`Edit ${definition.singularTitle}`} description={definition.description} />
      {isDemo ? <DemoBanner /> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <ModuleForm definition={definition} generatorOptions={generatorOptions} record={row} />
    </div>
  );
}

export async function GeneratorDetailPage({ id }: { id: string }) {
  const definition = getModuleDefinition("generators");
  const { row, isDemo } = await getModuleRecord("generators", id);

  if (!row) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader title={String(row.generator_id ?? "Generator")} description="Generator asset registry detail, including nameplate, electrical, engine, alternator, controller, fuel, and operational fields." />
      {isDemo ? <DemoBanner /> : null}
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Asset Profile</h3>
        </div>
        <dl className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-3">
          {definition.fields
            .filter((field) => field.type !== "file")
            .map((field) => {
              const value = row[field.name];
              const display =
                field.type === "date"
                  ? formatDate(value)
                  : field.type === "number"
                    ? formatNumber(value)
                    : typeof value === "string"
                      ? humanize(value)
                      : value === null || value === undefined
                        ? "Not set"
                        : String(value);

              return (
                <div key={field.name} className="bg-white px-5 py-4">
                  <dt className="text-xs font-semibold uppercase text-slate-500">{field.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {field.name === "status" ? <StatusBadge value={value} /> : display}
                  </dd>
                </div>
              );
            })}
        </dl>
      </div>
    </div>
  );
}
