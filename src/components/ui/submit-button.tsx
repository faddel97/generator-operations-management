"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "danger" | "secondary" }) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-teal-700 text-white hover:bg-teal-800",
    danger: "bg-red-700 text-white hover:bg-red-800",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition disabled:opacity-60 ${styles[variant]}`}
    >
      {pending ? "Working..." : children}
    </button>
  );
}
