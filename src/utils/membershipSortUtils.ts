import type { Membership } from "@/types/memberships";

export interface SortHierarchyContext {
  deptOrderMap: Map<string, number>;
  rolePositionMap: Map<string, number>; // key: `${deptName}-${roleName}`
  roleTierMap?: Map<string, number>; // key: `${deptName}-${roleName}`
}

export function compareMembershipsByHierarchy(
  a: Membership,
  b: Membership,
  ctx: SortHierarchyContext
): number {
  // Department display order
  const deptA = ctx.deptOrderMap.get(a.departmentName) ?? 999;
  const deptB = ctx.deptOrderMap.get(b.departmentName) ?? 999;
  if (deptA !== deptB) return deptA - deptB;

  // Role hierarchy position in department
  const posA = ctx.rolePositionMap.get(`${a.departmentName}-${a.roleName}`) ?? 999;
  const posB = ctx.rolePositionMap.get(`${b.departmentName}-${b.roleName}`) ?? 999;
  if (posA !== posB) return posA - posB;

  // Role Tier & Permissions count
  if (ctx.roleTierMap) {
    const weightA = ctx.roleTierMap.get(`${a.departmentName}-${a.roleName}`) ?? 4000;
    const weightB = ctx.roleTierMap.get(`${b.departmentName}-${b.roleName}`) ?? 4000;
    if (weightA !== weightB) return weightB - weightA;
  }

  // Alphabetical by user name
  return a.userName.localeCompare(b.userName);
}

export function compareMembershipsByActiveAndHierarchy(
  a: Membership,
  b: Membership,
  ctx: SortHierarchyContext
): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
  return compareMembershipsByHierarchy(a, b, ctx);
}
