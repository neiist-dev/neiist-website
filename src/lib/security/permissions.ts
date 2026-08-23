import { UserRole, ROLE_HIERARCHY } from "@/types/user";
import {
  getAllMemberships,
  getAllValidDepartmentRoles,
} from "@/lib/db/repositories/team.repository";

export const getRoleLevel = (role?: UserRole | string | null): number =>
  role ? (ROLE_HIERARCHY[String(role).toLowerCase() as UserRole] ?? 0) : 0;

export const getMaxRoleLevel = (roles: UserRole[] = []): number =>
  Math.max(0, ...roles.map(getRoleLevel));

export async function canManageDepartment(
  actorRoles: UserRole[] = [],
  actorIstid: string = "",
  targetDepartment: string = ""
): Promise<boolean> {
  if (actorRoles.includes(UserRole._ADMIN)) return true;
  if (!actorRoles.includes(UserRole._COORDINATOR)) return false;
  if (!targetDepartment || !actorIstid) return false;

  const targetDeptLower = targetDepartment.trim().toLowerCase();

  const [memberships, validRoles] = await Promise.all([
    getAllMemberships(),
    getAllValidDepartmentRoles(),
  ]);

  const userMembership = memberships.find(
    (membership) =>
      membership.userNumber === actorIstid &&
      membership.isActive &&
      membership.departmentName.trim().toLowerCase() === targetDeptLower
  );

  if (!userMembership) return false;

  const matchingRole = validRoles.find(
    (role) =>
      role.active &&
      role.department_name.trim().toLowerCase() === targetDeptLower &&
      role.role_name.trim().toLowerCase() === userMembership.roleName.trim().toLowerCase()
  );

  return matchingRole?.access?.toLowerCase() === "coordinator";
}

export function canAssignRoleAccess(
  actorRoles: UserRole[] = [],
  targetAccess?: UserRole | string | null
): boolean {
  if (actorRoles.includes(UserRole._ADMIN)) return true;
  const target = getRoleLevel(targetAccess);
  return target < getRoleLevel(UserRole._COORDINATOR) && getMaxRoleLevel(actorRoles) > target;
}
