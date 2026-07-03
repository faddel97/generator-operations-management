import { Bell, Gauge, LogOut } from "lucide-react";

import { signOutAction } from "@/lib/actions";
import { roleLabel } from "@/lib/permissions";
import type { SessionContext } from "@/types/app";
import { Navigation } from "@/components/navigation";

export function AppShell({ children, context }: { children: React.ReactNode; context: SessionContext }) {
  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-[#15201f] text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-500/20 text-teal-100">
            <Gauge className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-teal-100">GOM</div>
            <div className="text-base font-semibold">Generator Ops</div>
          </div>
        </div>
        <Navigation role={context.role} />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Operations Department</p>
              <h1 className="truncate text-lg font-semibold text-slate-950">Generator Operations Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:flex">
                <Bell className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span>{roleLabel(context.role)}</span>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-[#15201f] lg:hidden">
            <Navigation role={context.role} compact />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
