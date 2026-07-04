import { Database } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <strong>Demo preview data.</strong> Supabase is not configured or no live rows are available. These sample rows are clearly marked and are not real generator data.
        You can add local test records on this computer; they are saved only in `.local-data` and are not production data.
      </div>
    </div>
  );
}
