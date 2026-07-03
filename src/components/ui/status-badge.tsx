import { humanize } from "@/lib/format";

const badgeStyles: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800",
  offline: "border-zinc-300 bg-zinc-100 text-zinc-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  submitted: "border-sky-200 bg-sky-50 text-sky-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  draft: "border-zinc-300 bg-zinc-100 text-zinc-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800"
};

export function StatusBadge({ value }: { value: unknown }) {
  const text = typeof value === "string" && value ? value : "not_set";
  const className = badgeStyles[text] ?? "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex min-w-16 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {humanize(text)}
    </span>
  );
}
