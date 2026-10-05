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
    "photos:read",
    "photos:write_dept",
    "orders:read",
    "orders:read_customer",
    "voting:read",
  ],
  [UserRole._MEMBER]: ["orders:read_customer", "orders:create", "photos:read", "voting:read"],
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
];

const COORDINATOR_LEVEL_PERMISSIONS: Permission[] = ["memberships:write_dept", "photos:write_dept"];

export function deriveAccessLabel(permissions: Permission[]): "admin" | "coordinator" | null {
  const set = new Set(permissions);
  if (ADMIN_LEVEL_PERMISSIONS.some((p) => set.has(p))) return "admin";
  if (COORDINATOR_LEVEL_PERMISSIONS.some((p) => set.has(p))) return "coordinator";
  return null;
}

export function hasPermission(
  user: User | null | undefined,
  permission: Permission,
  context?: { department?: string }
): boolean {
  if (!user) return false;

  // Global permission
  if (user.permissions?.includes(permission)) return true;

  // Explicit department context
  if (context?.department) {
    const deptPerms = user.departmentPermissions?.[context.department] ?? [];
    return deptPerms.includes(permission);
  }

  if (user.departmentPermissions)
    return Object.values(user.departmentPermissions).some((perms) => perms.includes(permission));

  return false;
}

export function getDevOverridePermissions(devRole: string): Permission[] | undefined {
  const normalized = devRole.toLowerCase();
  if (normalized === "admin") return ROLE_PRESETS[UserRole._ADMIN];
  if (normalized === "coordinator") return ROLE_PRESETS[UserRole._COORDINATOR];
  if (normalized === "member") return ROLE_PRESETS[UserRole._MEMBER];
  return undefined;
}
