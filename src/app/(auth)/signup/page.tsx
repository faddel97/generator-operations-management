import Link from "next/link";
import { Gauge } from "lucide-react";

import { signUpAction } from "@/lib/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#15201f] px-4 py-10">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-700 text-white">
            <Gauge className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">GOM</p>
            <h1 className="text-xl font-semibold text-slate-950">Create account</h1>
          </div>
        </div>

        <form action={signUpAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Full name</label>
            <input name="full_name" required className="form-input" autoComplete="name" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
            <input name="email" type="email" required className="form-input" autoComplete="email" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
            <input name="password" type="password" required minLength={8} className="form-input" autoComplete="new-password" />
          </div>
          <SubmitButton>Create account</SubmitButton>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
