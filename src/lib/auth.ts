import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, SessionContext } from "@/types/app";

type ProfileLookup = {
  from(table: "users"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{
          data: { full_name: string | null; role: AppRole } | null;
        }>;
      };
    };
  };
};

export async function getSessionContext(): Promise<SessionContext> {
  if (!isSupabaseConfigured()) {
    return {
      isSupabaseConfigured: false,
      isDemoMode: true,
      userId: null,
      email: "demo.admin@gom.local",
      fullName: "Demo Admin",
      role: "admin"
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isSupabaseConfigured: true,
      isDemoMode: false,
      userId: null,
      email: null,
      fullName: null,
      role: "viewer"
    };
  }

  const profileClient = supabase as unknown as ProfileLookup;
  const { data: profile } = await profileClient
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isSupabaseConfigured: true,
    isDemoMode: false,
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    role: (profile?.role as AppRole | undefined) ?? "viewer"
  };
}

export async function requireAuthenticated() {
  const context = await getSessionContext();

  if (context.isSupabaseConfigured && !context.userId) {
    redirect("/login");
  }

  return context;
}
