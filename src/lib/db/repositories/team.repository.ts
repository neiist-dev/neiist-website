import {
  Membership,
  dbMembership,
  mapdbMembershipToMembership,
  Description,
} from "@/types/memberships";
import { Permission } from "@/types/permissions";
import { db_query } from "@/lib/db/connection";
import { getAllUsers } from "@/lib/db/repositories/user.repository";

import { cacheTag, revalidateTag } from "next/cache";

export const getDepartmentDisplayOrder = async (): Promise<
  Array<{ name: string; department_type: string; active: boolean; display_order: number }>
> => {
  "use cache";
  cacheTag("department_order");
  const { rows } = await db_query<{
    name: string;
    department_type: string;
    active: boolean;
    display_order: number;
  }>("SELECT * FROM neiist.get_department_display_order()");
  return rows;
};

export const setDepartmentDisplayOrder = async (departmentNames: string[]): Promise<boolean> => {
  await db_query("SELECT neiist.set_department_display_order($1)", [departmentNames]);
  revalidateTag("department_order", "max");
  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  return true;
};

export const addDepartment = async (
  name: string,
  type: "team" | "admin_body" = "team",
  description?: Description
): Promise<boolean> => {
  await db_query("SELECT neiist.add_department($1, $2, $3::jsonb)", [
    name,
    type,
    JSON.stringify(description || {}),
  ]);
  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  return true;
};

export const removeDepartment = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.remove_department($1)", [name]);
  revalidateTag("departments", "max");
  return true;
};

export const activateDepartment = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.activate_department($1)", [name]);
  revalidateTag("departments", "max");
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidateTag("department_roles", "max");
  return true;
};

export const deleteDepartment = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.delete_department($1)", [name]);
  revalidateTag("teams", "max");
  revalidateTag("admin_bodies", "max");
  revalidateTag("departments", "max");
  revalidateTag("department_roles", "max");
  return true;
};

export const getDepartmentMemberCounts = async (): Promise<Record<string, number>> => {
  const memberships = await getAllMemberships();
  const counts: Record<string, number> = {};
  for (const m of memberships) {
    counts[m.departmentName] = (counts[m.departmentName] || 0) + 1;
  }
  return counts;
};

export const getAllDepartments = async (): Promise<
  Array<{ name: string; department_type: string; active: boolean; display_order?: number }>
> => {
  "use cache";
  cacheTag("departments");
  const { rows } = await db_query<{
    name: string;
    department_type: string;
    active: boolean;
    display_order?: number;
  }>("SELECT * FROM neiist.get_all_departments()");
  return rows;
};

export const updateTeamDescription = async (
  name: string,
  description: Description
): Promise<boolean> => {
  await db_query("SELECT neiist.update_team_description($1, $2::jsonb)", [
    name,
    JSON.stringify(description || {}),
  ]);
  revalidateTag("teams", "max");
  return true;
};

export const getAllTeams = async (): Promise<
  Array<{
    name: string;
    description: Description;
    active: boolean;
    display_order?: number;
  }>
> => {
  "use cache";
  cacheTag("teams");
  const { rows } = await db_query<{
    name: string;
    description: Description;
    active: boolean;
    display_order?: number;
  }>("SELECT * FROM neiist.get_all_teams()");
  return rows;
};

export const getAllAdminBodies = async (): Promise<Array<{ name: string; active: boolean }>> => {
  "use cache";
  cacheTag("admin_bodies");
  const { rows } = await db_query<{ name: string; active: boolean }>(
    "SELECT * FROM neiist.get_all_admin_bodies()"
  );
  return rows;
};

export const addValidDepartmentRole = async (
  departmentName: string,
  roleName: string,
  accessLabel?: string | null
): Promise<boolean> => {
  await db_query("SELECT neiist.add_valid_department_role($1, $2, $3::neiist.access_label_enum)", [
    departmentName,
    roleName,
    accessLabel ?? null,
  ]);
  revalidateTag("department_roles", "max");
  revalidateTag("users", "max");
  return true;
};

export const setRoleAccessLabel = async (
  departmentName: string,
  roleName: string,
  accessLabel: string | null
): Promise<boolean> => {
  await db_query("SELECT neiist.set_role_access_label($1, $2, $3::neiist.access_label_enum)", [
    departmentName,
    roleName,
    accessLabel,
  ]);
  revalidateTag("department_roles", "max");
  revalidateTag("users", "max");
  return true;
};

export const removeValidDepartmentRole = async (
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  await db_query("SELECT neiist.remove_valid_department_role($1, $2)", [departmentName, roleName]);
  revalidateTag("department_roles", "max");
  return true;
};

export const deleteValidDepartmentRole = async (
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  await db_query("SELECT neiist.delete_valid_department_role($1, $2)", [departmentName, roleName]);
  revalidateTag("department_roles", "max");
  return true;
};

export const getAllDepartmentRoles = async (): Promise<
  Array<{
    department_name: string;
    department_type: string;
    role_name: string;
    active: boolean;
    access_label: "admin" | "coordinator" | null;
    permissions: Permission[];
  }>
> => {
  "use cache";
  cacheTag("department_roles");
  const { rows } = await db_query<{
    department_name: string;
    department_type: string;
    role_name: string;
    active: boolean;
    access_label: "admin" | "coordinator" | null;
    permissions: Permission[];
  }>(
    "SELECT department_name, department_type, role_name, active, access_label, permissions FROM neiist.get_all_department_roles()"
  );
  return rows;
};

export const setRolePermissions = async (
  departmentName: string,
  roleName: string,
  permissions: Permission[]
): Promise<boolean> => {
  await db_query("SELECT neiist.set_role_permissions($1, $2, $3)", [
    departmentName,
    roleName,
    permissions,
  ]);
  revalidateTag("role_permissions", "max");
  revalidateTag("department_roles", "max");
  revalidateTag("user_permissions", "max");
  revalidateTag("users", "max");
  return true;
};

export const getAcademicYears = async (): Promise<string[]> => {
  "use cache";
  cacheTag("academic_years");
  const { rows } = await db_query<{ academic_year: string }>(
    "SELECT academic_year FROM neiist.get_academic_years()"
  );
  return rows.map((r) => r.academic_year);
};

export const getMembershipsForAcademicYear = async (
  academicYear: string
): Promise<Membership[]> => {
  "use cache";
  cacheTag("memberships");
  const { rows } = await db_query<dbMembership>(
    "SELECT * FROM neiist.get_memberships_for_academic_year($1)",
    [academicYear]
  );
  return rows.map(mapdbMembershipToMembership);
};

export const addMembership = async (
  istid: string,
  departmentName: string,
  roleName: string,
  fromDate?: string,
  toDate?: string
): Promise<boolean> => {
  await db_query("SELECT neiist.add_membership($1, $2, $3, $4, $5)", [
    istid,
    departmentName,
    roleName,
    fromDate || new Date().toISOString().split("T")[0],
    toDate || null,
  ]);
  revalidateTag("memberships", "max");
  revalidateTag("academic_years", "max");
  revalidateTag("users", "max");
  return true;
};

export const concludeMembership = async (
  istid: string,
  departmentName: string,
  roleName: string,
  fromDate: string
): Promise<boolean> => {
  await db_query("SELECT neiist.conclude_membership($1, $2, $3, $4)", [
    istid,
    departmentName,
    roleName,
    fromDate,
  ]);
  revalidateTag("memberships", "max");
  revalidateTag("users", "max");
  return true;
};

export const deleteMembership = async (
  istid: string,
  departmentName: string,
  roleName: string,
  fromDate: string
): Promise<boolean> => {
  await db_query("SELECT neiist.delete_membership($1, $2, $3, $4)", [
    istid,
    departmentName,
    roleName,
    fromDate,
  ]);
  revalidateTag("memberships", "max");
  revalidateTag("academic_years", "max");
  revalidateTag("users", "max");
  return true;
};

export const getUserMemberships = async (
  istid: string,
  activeOnly: boolean = true
): Promise<Membership[]> => {
  "use cache";
  cacheTag("memberships");
  const { rows } = await db_query<dbMembership>(
    "SELECT * FROM neiist.get_user_memberships($1::VARCHAR(10), $2::BOOLEAN)",
    [istid, activeOnly]
  );
  return rows.map(mapdbMembershipToMembership);
};

export const getAllMemberships = async (): Promise<Membership[]> => {
  "use cache";
  cacheTag("memberships");
  const [dbMemberships, users] = await Promise.all([
    db_query<dbMembership>("SELECT * FROM neiist.get_all_memberships()").then((res) => res.rows),
    getAllUsers(),
  ]);
  const userMap = new Map(users.map((u) => [u.istid, u]));
  return dbMemberships.map((raw) => {
    const user = userMap.get(raw.user_istid);
    return mapdbMembershipToMembership({
      ...raw,
      user_email: user?.email ?? raw.user_email,
      user_photo: user?.photo ?? raw.user_photo,
      user_github: user?.github ?? raw.user_github,
      user_linkedin: user?.linkedin ?? raw.user_linkedin,
    });
  });
};

export const getDepartmentRoleOrders = async (
  departmentNames: string[]
): Promise<Array<{ department_name: string; role_name: string; position: number }>> => {
  "use cache";
  cacheTag("department_roles");
  if (!departmentNames || departmentNames.length === 0) return [];
  const { rows } = await db_query<{
    department_name: string;
    role_name: string;
    position: number;
  }>("SELECT * FROM neiist.get_department_role_orders($1::text[])", [departmentNames]);
  return rows;
};

export const setDepartmentRoleOrder = async (
  departmentName: string,
  roles: string[]
): Promise<boolean> => {
  await db_query("SELECT neiist.set_department_role_order($1, $2)", [departmentName, roles]);
  revalidateTag("department_roles", "max");
  return true;
};
