import type { AppRole } from "@/types/app";

const roleRank: Record<AppRole, number> = {
  viewer: 1,
  technician: 2,
  supervisor: 3,
  admin: 4
};

export function hasRole(role: AppRole, allowed: AppRole[]) {
  return allowed.includes(role);
}

export function hasMinimumRole(role: AppRole, minimum: AppRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function canCreate(role: AppRole) {
  return hasRole(role, ["admin", "supervisor", "technician"]);
}

export function canReview(role: AppRole) {
  return hasRole(role, ["admin", "supervisor"]);
}

export function canDelete(role: AppRole) {
  return role === "admin";
}

export function roleLabel(role: AppRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
