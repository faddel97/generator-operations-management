import Link from "next/link";
import { Gauge } from "lucide-react";

import { signInAction } from "@/lib/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "auth-callback": "We could not finish that authentication link. Please sign in again.",
  "auth-failed": "Authentication failed. Check the Supabase settings and try again.",
  "database-setup": "Supabase is connected, but the database schema has not been installed correctly.",
  "invalid-credentials": "The email or password is incorrect.",
  "supabase-missing": "Supabase is not configured for this deployment yet."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();
  const params = (await searchParams) ?? {};

  return (
    <main className="grid min-h-screen bg-[#15201f] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md rounded-md bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-700 text-white">
              <Gauge className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">GOM</p>
              <h1 className="text-xl font-semibold text-slate-950">Sign in</h1>
            </div>
          </div>

          {!configured ? (
            <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Supabase is not configured. You can open the demo dashboard without authentication.
            </div>
          ) : null}

          {params.message === "check-email" ? (
            <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
              Check your email to confirm the account, then sign in.
            </div>
          ) : null}

          {params.error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
              {errorMessages[params.error] ?? "Unable to complete sign in. Please try again."}
            </div>
          ) : null}

          <form action={signInAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
              <input name="email" type="email" required className="form-input" autoComplete="email" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
              <input name="password" type="password" required className="form-input" autoComplete="current-password" />
            </div>
            <SubmitButton>Sign in</SubmitButton>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-800">
              Create account
            </Link>
            {!configured ? (
              <Link href="/dashboard" className="font-semibold text-slate-700 hover:text-slate-950">
                Open demo dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <section className="hidden border-l border-white/10 bg-[linear-gradient(135deg,#1f2f2d_0%,#17211f_55%,#2f2b1b_100%)] p-10 text-white lg:flex lg:items-end">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Industrial Operations</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">Generator assets, inspections, maintenance, and analytics in one controlled workspace.</h2>
        </div>
      </section>
    </main>
  );
}
