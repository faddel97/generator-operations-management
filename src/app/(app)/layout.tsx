import { AppShell } from "@/components/app-shell";
import { requireAuthenticated } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAuthenticated();

  return <AppShell context={context}>{children}</AppShell>;
}
