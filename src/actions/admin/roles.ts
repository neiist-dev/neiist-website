"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { verifyPermission } from "@/lib/auth";
import {
  addValidDepartmentRole,
  deleteValidDepartmentRole,
  removeValidDepartmentRole,
  setDepartmentRoleOrder,
  setRoleAccessLabel,
  setRolePermissions,
} from "@/lib/db/repositories/team.repository";
import { deriveAccessLabel } from "@/lib/security/permissions";
import type { Permission } from "@/types/permissions";

export async function saveRolePermissionsAction(params: {
  departmentName: string;
  roleName: string;
  permissions: Permission[];
}) {
  const auth = await verifyPermission("roles:write", {
    department: params.departmentName,
  });
  if (auth.error) throw new Error(auth.error.statusText || "Unauthorized");

  const success = await setRolePermissions(
    params.departmentName,
    params.roleName,
    params.permissions
  );
  if (!success) throw new Error("Failed to save permissions");

  const derivedLabel = deriveAccessLabel(params.permissions);
  await setRoleAccessLabel(params.departmentName, params.roleName, derivedLabel);

  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true, access_label: derivedLabel };
}

export async function addRoleAction(params: {
  departmentName: string;
  roleName: string;
  permissions: Permission[];
}) {
  const auth = await verifyPermission("roles:write", {
    department: params.departmentName,
  });
  if (auth.error) throw new Error(auth.error.statusText || "Unauthorized");

  const accessLabel = deriveAccessLabel(params.permissions);
  const success = await addValidDepartmentRole(params.departmentName, params.roleName, accessLabel);
  if (!success) throw new Error("Failed to add role");

  if (params.permissions.length > 0)
    await setRolePermissions(params.departmentName, params.roleName, params.permissions);

  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true, access_label: accessLabel };
}

export async function removeRoleAction(params: {
  departmentName: string;
  roleName: string;
  permanent?: boolean;
}) {
  const auth = await verifyPermission("roles:delete", {
    department: params.departmentName,
  });
  if (auth.error) throw new Error(auth.error.statusText || "Unauthorized");

  const success = params.permanent
    ? await deleteValidDepartmentRole(params.departmentName, params.roleName)
    : await removeValidDepartmentRole(params.departmentName, params.roleName);

  if (!success) throw new Error("Failed to remove role");

  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function reorderRoleHierarchyAction(params: {
  departmentName: string;
  roles: string[];
}) {
  const auth = await verifyPermission("roles:write", {
    department: params.departmentName,
  });
  if (auth.error) throw new Error(auth.error.statusText || "Unauthorized");

  const success = await setDepartmentRoleOrder(params.departmentName, params.roles);
  if (!success) throw new Error("Failed to reorder roles");

  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}
