import type { User } from "@/types/user";
import type { Permission } from "@/types/permissions";

export enum UserRole {
  _ADMIN = "admin",
  _COORDINATOR = "coordinator",
  _MEMBER = "member",
  _GUEST = "guest",
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole._ADMIN]: 100,
  [UserRole._COORDINATOR]: 80,
  [UserRole._MEMBER]: 40,
  [UserRole._GUEST]: 10,
};

export interface RoleItem {
  role_name: string;
  active: boolean;
  department_name?: string;
  department?: string;
  access_label?: "admin" | "coordinator" | null;
  permissions?: Permission[];
  memberCount?: number;
}

export function mapAccessLabelToUserRole(
  accessLabel: "admin" | "coordinator" | string | null | undefined,
  hasActiveMembership: boolean
): UserRole {
  if (accessLabel === "admin") return UserRole._ADMIN;
  if (accessLabel === "coordinator") return UserRole._COORDINATOR;
  if (hasActiveMembership) return UserRole._MEMBER;
  return UserRole._GUEST;
}

export function mapRoleToUserRole(role: string): UserRole {
  switch (role.toLowerCase()) {
    case "member":
      return UserRole._MEMBER;
    case "coordinator":
      return UserRole._COORDINATOR;
    case "admin":
      return UserRole._ADMIN;
    default:
      return UserRole._GUEST;
  }
}

export function hasRequiredRole(userRoles: UserRole[], required: UserRole[]): boolean {
  if (!required || required.length === 0) return true;
  return userRoles.some((role) => required.includes(role));
}

export function checkRoles(user: User | null | undefined, required: UserRole[]): boolean {
  if (!required || required.length === 0) return true;
  return hasRequiredRole(user?.roles ?? [UserRole._GUEST], required);
}
