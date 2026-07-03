import Link from "next/link";
import { Check, Edit, Eye, Trash2, X } from "lucide-react";

import { deleteModuleRecordAction, reviewRecordAction } from "@/lib/actions";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import { canDelete, canReview, hasRole } from "@/lib/permissions";
import type { ModuleDefinition, SessionContext } from "@/types/app";
import type { GenericRow } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return "Recorded";
  }

  return humanize(String(value));
}

function TableCellValue({
  value,
  type,
  generatorMap
}: {
  value: unknown;
  type?: "text" | "date" | "status" | "approval" | "number" | "boolean";
  generatorMap: Map<string, string>;
}) {
  if (type === "status" || type === "approval") {
    return <StatusBadge value={value} />;
  }

  if (type === "date") {
    return <span>{formatDate(value)}</span>;
  }

  if (type === "number") {
    return <span>{formatNumber(value)}</span>;
  }

  if (type === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }

  if (typeof value === "string" && generatorMap.has(value)) {
    return <span>{generatorMap.get(value)}</span>;
  }

  return <span>{stringifyValue(value)}</span>;
}

export function ModuleTable({
  definition,
  rows,
  context,
  generatorMap
}: {
  definition: ModuleDefinition;
  rows: GenericRow[];
  context: SessionContext;
  generatorMap: Map<string, string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{definition.emptyState}</p>
      </div>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {definition.columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                {column.label}
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={String(row.id)} className="hover:bg-slate-50">
              {definition.columns.map((column) => (
                <td key={column.key} className="max-w-72 px-4 py-3 align-top text-slate-700">
                  <TableCellValue value={row[column.key]} type={column.type} generatorMap={generatorMap} />
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {definition.detailEnabled ? (
                    <Link
                      href={`${definition.path}/${row.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : null}
                  {hasRole(context.role, definition.updateRoles) ? (
                    <Link
                      href={`${definition.path}/${row.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : null}
                  {definition.reviewable && canReview(context.role) ? (
                    <>
                      <form action={reviewRecordAction}>
                        <input type="hidden" name="moduleKey" value={definition.key} />
                        <input type="hidden" name="recordId" value={String(row.id)} />
                        <input type="hidden" name="status" value="approved" />
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={reviewRecordAction}>
                        <input type="hidden" name="moduleKey" value={definition.key} />
                        <input type="hidden" name="recordId" value={String(row.id)} />
                        <input type="hidden" name="status" value="rejected" />
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          title="Reject"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </>
                  ) : null}
                  {canDelete(context.role) ? (
                    <form action={deleteModuleRecordAction}>
                      <input type="hidden" name="moduleKey" value={definition.key} />
                      <input type="hidden" name="recordId" value={String(row.id)} />
                      <button
                        type="submit"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
