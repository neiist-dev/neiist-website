import type { User } from "@/types/user";
import { UserRole } from "@/types/roles";
import { Permission, PERMISSIONS } from "@/types/permissions";

/**
 * Standard capability presets for user roles.
 * UI presets
 * Local development overrides (DEV_ISTID).
 */
export const ROLE_PRESETS: Record<UserRole, Permission[]> = {
  [UserRole._ADMIN]: Object.keys(PERMISSIONS) as Permission[],
  [UserRole._COORDINATOR]: [
    "departments:read",
    "roles:read",
    "memberships:read",
    "memberships:write_dept",
    "photos:write_dept",
    "shop:read",
    "shop:write",
    "pos:access",
    "pos:manage",
    "pos:guest_checkout",
    "orders:read",
    "orders:read_customer",
    "orders:create",
    "orders:write",
    "orders:deliver",
    "orders:override",
    "voting:read",
    "events:read",
    "events:write",
    "events:checkin",
  ],
  [UserRole._MEMBER]: [
    "orders:read_customer",
    "orders:deliver",
    "orders:create",
    "pos:access",
    "pos:guest_checkout",
  ],
  [UserRole._GUEST]: [],
};

const ADMIN_LEVEL_PERMISSIONS: Permission[] = [
  "users:delete",
  "departments:delete",
  "departments:write",
  "roles:write",
  "roles:delete",
  "memberships:write_global",
  "memberships:delete",
  "orders:delete",
  "events:delete",
];

const COORDINATOR_LEVEL_PERMISSIONS: Permission[] = [
  "memberships:write_dept",
  "photos:write_dept",
  "events:write",
  "events:checkin",
];

export function deriveAccessLabel(permissions: Permission[]): "admin" | "coordinator" | null {
  const set = new Set(permissions);
  if (ADMIN_LEVEL_PERMISSIONS.some((p) => set.has(p))) return "admin";
  if (COORDINATOR_LEVEL_PERMISSIONS.some((p) => set.has(p))) return "coordinator";
  return null;
}

export type PermissionMatchMode = "all" | "any";

export interface PermissionCheckOptions {
  department?: string;
  match?: PermissionMatchMode;
}

function hasSinglePermission(user: User, permission: Permission, department?: string): boolean {
  // Global permission
  if (user.permissions?.includes(permission)) return true;

  // Explicit department context
  if (department) {
    const deptPerms = user.departmentPermissions?.[department] ?? [];
    return deptPerms.includes(permission);
  }

  if (user.departmentPermissions)
    return Object.values(user.departmentPermissions).some((perms) => perms.includes(permission));

  return false;
}

export function hasPermission(
  user: User | null | undefined,
  permission: Permission | Permission[],
  options?: PermissionCheckOptions
): boolean {
  if (!user) return false;
  if (!Array.isArray(permission)) {
    return hasSinglePermission(user, permission, options?.department);
  }
  const check = (p: Permission) => hasSinglePermission(user, p, options?.department);
  return options?.match === "any" ? permission.some(check) : permission.every(check);
}

export function getDevOverridePermissions(devRole: string): Permission[] | undefined {
  const normalized = devRole.toLowerCase();
  if (normalized === "admin") return ROLE_PRESETS[UserRole._ADMIN];
  if (normalized === "coordinator") return ROLE_PRESETS[UserRole._COORDINATOR];
  if (normalized === "member") return ROLE_PRESETS[UserRole._MEMBER];
  return undefined;
}
