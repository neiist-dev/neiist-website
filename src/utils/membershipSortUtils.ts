import type { Membership } from "@/types/memberships";
import { type RoleItem, ROLE_HIERARCHY, mapAccessLabelToUserRole } from "@/types/roles";

export function getRolePower(deptName: string, roleName: string, roles: RoleItem[]): number {
  const role = roles.find(
    (r) => (r.department_name || r.department) === deptName && r.role_name === roleName
  );
  if (!role) return 0;

  const userRole = mapAccessLabelToUserRole(role.access_label, true);
  return ROLE_HIERARCHY[userRole] * 100 + (role.permissions?.length ?? 0);
}

export function compareMandatePower(a: Membership, b: Membership, roles: RoleItem[]): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
  const powerDiff =
    getRolePower(b.departmentName, b.roleName, roles) -
    getRolePower(a.departmentName, a.roleName, roles);
  if (powerDiff !== 0) return powerDiff;
  return (b.startDate || "").localeCompare(a.startDate || "");
}
