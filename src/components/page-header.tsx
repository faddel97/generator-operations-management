import Link from "next/link";
import { Plus } from "lucide-react";

import type { AppRole } from "@/types/app";
import { hasRole } from "@/lib/permissions";

export function PageHeader({
  title,
  description,
  addHref,
  addLabel,
  role,
  allowedRoles
}: {
  title: string;
  description: string;
  addHref?: string;
  addLabel?: string;
  role?: AppRole;
  allowedRoles?: AppRole[];
}) {
  const showAdd = addHref && addLabel && role && allowedRoles && hasRole(role, allowedRoles);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {showAdd ? (
        <Link
          href={addHref}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Link>
      ) : null}
    </div>
  );
}
