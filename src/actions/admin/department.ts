"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  activateDepartment,
  addDepartment,
  deleteDepartment,
  removeDepartment,
  setDepartmentDisplayOrder,
  updateTeamDescription,
} from "@/lib/db/repositories/team.repository";
import type { Description } from "@/types/memberships";

export async function addDepartmentAction(params: {
  name: string;
  type: "team" | "admin_body";
  description?: Description;
}) {
  await requirePermission("departments:write");

  const success = await addDepartment(params.name, params.type, params.description);

  if (!success) throw new Error("Failed to create department");

  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function updateTeamDescriptionAction(params: {
  name: string;
  description: Description;
}) {
  await requirePermission("departments:write");

  const success = await updateTeamDescription(params.name, params.description);
  if (!success) throw new Error("Failed to update team description");

  revalidateTag("teams", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function reorderDepartmentsAction(departments: string[]) {
  await requirePermission("departments:write");

  const success = await setDepartmentDisplayOrder(departments);
  if (!success) throw new Error("Failed to update department order");

  revalidateTag("department_order", "max");
  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function deactivateDepartmentAction(name: string) {
  await requirePermission("departments:delete");

  const success = await removeDepartment(name);
  if (!success) throw new Error("Failed to deactivate department");

  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function reactivateDepartmentAction(name: string) {
  await requirePermission("departments:write");

  const success = await activateDepartment(name);
  if (!success) throw new Error("Failed to reactivate department");

  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function deleteDepartmentAction(name: string) {
  await requirePermission("departments:delete");

  const success = await deleteDepartment(name);
  if (!success) throw new Error("Failed to permanently delete department");

  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidateTag("department_roles", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}
