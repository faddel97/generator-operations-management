"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  History,
  Home,
  ListChecks,
  PlugZap,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  UploadCloud,
  Wrench
} from "lucide-react";

import type { AppRole } from "@/types/app";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, roles: ["admin", "supervisor", "technician", "viewer"] },
  { label: "Generators", href: "/generators", icon: Gauge, roles: ["admin", "supervisor", "technician"] },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck, roles: ["admin", "supervisor", "technician"] },
  { label: "DSE Monitoring", href: "/dse-readings", icon: Activity, roles: ["admin", "supervisor", "technician"] },
  { label: "ATS Tests", href: "/ats-tests", icon: PlugZap, roles: ["admin", "supervisor", "technician"] },
  { label: "ATS Manual", href: "/ats-manual", icon: SlidersHorizontal, roles: ["admin", "supervisor", "technician"] },
  { label: "Maintenance", href: "/maintenance", icon: Wrench, roles: ["admin", "supervisor", "technician"] },
  { label: "Load Tests", href: "/load-tests", icon: ListChecks, roles: ["admin", "supervisor", "technician"] },
  { label: "Vibration", href: "/vibration-tests", icon: UploadCloud, roles: ["admin", "supervisor", "technician"] },
  { label: "Reports", href: "/reports", icon: FileBarChart, roles: ["admin", "supervisor", "technician", "viewer"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "supervisor", "technician", "viewer"] },
  { label: "Alarms", href: "/alarms", icon: ShieldAlert, roles: ["admin", "supervisor", "technician"] },
  { label: "Event Logs", href: "/event-logs", icon: History, roles: ["admin", "supervisor", "technician"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"] }
] satisfies Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles: AppRole[] }>;

export function Navigation({ role, compact = false }: { role: AppRole; compact?: boolean }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  if (compact) {
    return (
      <nav className="table-scroll flex gap-1 overflow-x-auto px-3 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-teal-500 text-white" : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-3 py-5">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-teal-500 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
