import { Membership, dbMembership, mapdbMembershipToMembership } from "@/types/memberships";
import { UserRole } from "@/types/user";
import { db_query } from "@/lib/db/connection";
import { getAllUsers } from "@/lib/db/repositories/user.repository";

import { cacheTag, revalidateTag } from "next/cache";

export const addDepartment = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_department($1)", [name]);
    revalidateTag("departments", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error adding department:", error);
    return false;
  }
};

export const removeDepartment = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_department($1)", [name]);
    revalidateTag("departments", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error removing department:", error);
    return false;
  }
};

export const getAllDepartments = async (): Promise<
  Array<{ name: string; department_type: string; active: boolean }>
> => {
  "use cache";
  cacheTag("departments");
  try {
    const { rows } = await db_query<{ name: string; department_type: string; active: boolean }>(
      "SELECT * FROM neiist.get_all_departments()"
    );
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting all departments:", error);
    return [];
  }
};

export const addTeam = async (name: string, description: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_team($1, $2)", [name, description]);
    revalidateTag("teams", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error adding team:", error);
    return false;
  }
};

export const removeTeam = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_team($1)", [name]);
    revalidateTag("teams", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error removing team:", error);
    return false;
  }
};

export const getAllTeams = async (): Promise<
  Array<{ name: string; description: string; active: boolean }>
> => {
  "use cache";
  cacheTag("teams");
  try {
    const { rows } = await db_query<{
      name: string;
      description: string;
      active: boolean;
    }>("SELECT * FROM neiist.get_all_teams()");
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting all teams:", error);
    return [];
  }
};

export const addAdminBody = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_admin_body($1)", [name]);
    revalidateTag("admin_bodies", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error adding admin body:", error);
    return false;
  }
};

export const removeAdminBody = async (name: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_admin_body($1)", [name]);
    revalidateTag("admin_bodies", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error removing admin body:", error);
    return false;
  }
};

export const getAllAdminBodies = async (): Promise<Array<{ name: string; active: boolean }>> => {
  "use cache";
  cacheTag("admin_bodies");
  try {
    const { rows } = await db_query<{ name: string; active: boolean }>(
      "SELECT * FROM neiist.get_all_admin_bodies()"
    );
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting admin bodies:", error);
    return [];
  }
};

export const getDepartmentRoles = async (
  departmentName: string
): Promise<Array<{ role_name: string; access: string; active: boolean }>> => {
  "use cache";
  cacheTag("department_roles");
  try {
    const { rows } = await db_query<{
      role_name: string;
      access: string;
      active: boolean;
    }>("SELECT role_name, access, active FROM neiist.get_department_roles($1)", [departmentName]);
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting department roles:", error);
    return [];
  }
};

export const addValidDepartmentRole = async (
  departmentName: string,
  roleName: string,
  access: UserRole = UserRole._MEMBER
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
      departmentName,
      roleName,
      access,
    ]);
    revalidateTag("department_roles", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error adding valid department role:", error);
    return false;
  }
};

export const removeValidDepartmentRole = async (
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_valid_department_role($1, $2)", [
      departmentName,
      roleName,
    ]);
    revalidateTag("department_roles", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error removing valid department role:", error);
    return false;
  }
};

export const getAllValidDepartmentRoles = async (): Promise<
  Array<{
    department_name: string;
    role_name: string;
    access: string;
    active: boolean;
  }>
> => {
  "use cache";
  cacheTag("department_roles");
  try {
    const { rows } = await db_query<{
      department_name: string;
      role_name: string;
      access: string;
      active: boolean;
    }>("SELECT * FROM neiist.get_all_valid_department_roles()");
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting all valid department roles:", error);
    return [];
  }
};

export const addTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, departmentName, roleName]);
    revalidateTag("memberships", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error adding team member:", error);
    return false;
  }
};

export const removeTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_team_member($1, $2, $3)", [
      istid,
      departmentName,
      roleName,
    ]);
    revalidateTag("memberships", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error removing team member:", error);
    return false;
  }
};

export const getAllMemberships = async (): Promise<Membership[]> => {
  "use cache";
  cacheTag("memberships");
  try {
    const [dbMemberships, users] = await Promise.all([
      db_query<dbMembership>("SELECT * FROM neiist.get_all_memberships()").then((res) => res.rows),
      getAllUsers(),
    ]);
    return dbMemberships.map((raw, idx) => {
      const user = users.find((u) => u.istid === raw.user_istid);
      return mapdbMembershipToMembership(raw, user?.email || "", user?.photo || "", idx);
    });
  } catch (error) {
    console.warn("[TeamRepository] Error getting all memberships:", error);
    return [];
  }
};

export const getDepartmentRoleOrder = async (
  departmentName: string
): Promise<Array<{ role_name: string; position: number }>> => {
  "use cache";
  cacheTag("department_roles");
  try {
    const { rows } = await db_query<{ role_name: string; position: number }>(
      "SELECT * FROM neiist.get_department_role_order($1)",
      [departmentName]
    );
    return rows;
  } catch (error) {
    console.warn("[TeamRepository] Error getting department role order:", error);
    return [];
  }
};

export const setDepartmentRoleOrder = async (
  departmentName: string,
  roles: string[]
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.set_department_role_order($1, $2)", [departmentName, roles]);
    revalidateTag("department_roles", "max");
    return true;
  } catch (error) {
    console.warn("[TeamRepository] Error setting department role order:", error);
    return false;
  }
};
