import { Membership, dbMembership, mapdbMembershipToMembership } from "@/types/memberships";
import { User, mapRoleToUserRole, mapdbUserToUser } from "@/types/user";

import { db_query } from "@/utils/db/dbClient";

export const createUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.istid || !user.name || !user.email) return null;
  try {
    const {
      rows: [newUser],
    } = await db_query<User>(
      `SELECT * FROM neiist.add_user($1::VARCHAR(10), $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT, $7::TEXT[])`,
      [
        user.istid,
        user.name,
        user.email,
        user.alternativeEmail,
        user.phone,
        user.photo,
        user.courses,
      ]
    );
    if (!newUser) return null;
    newUser.roles = newUser.roles?.map(mapRoleToUserRole);
    return newUser ? mapdbUserToUser(newUser) : null;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

export const updateUser = async (istid: string, updates: Partial<User>): Promise<User | null> => {
  const {
    rows: [updatedUser],
  } = await db_query<User>("SELECT * FROM neiist.update_user($1::VARCHAR(10), $2::JSONB)", [
    istid,
    JSON.stringify(updates),
  ]);
  if (!updatedUser) return null;
  updatedUser.roles = updatedUser.roles?.map(mapRoleToUserRole);
  return updatedUser ? mapdbUserToUser(updatedUser) : null;
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  await db_query("SELECT neiist.update_user_photo($1::VARCHAR(10), $2::TEXT)", [istid, photoData]);
  return true;
};

export const getUser = async (istid: string): Promise<User | null> => {
  const {
    rows: [user],
  } = await db_query<User>("SELECT * FROM neiist.get_user($1::VARCHAR(10))", [istid]);
  if (!user) return null;
  const dbMemberships = (
    await db_query<dbMembership>(
      "SELECT * FROM neiist.get_all_memberships() WHERE user_istid = $1 AND active = TRUE",
      [istid]
    )
  ).rows;
  const memberships: Membership[] = dbMemberships.map((raw, idx) =>
    mapdbMembershipToMembership(raw, user.email, user.photo, idx)
  );
  let highest: { roleName: string; position: number } | null = null;
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  for (const membership of memberships) {
    const { rows: roleOrder } = await db_query<{ role_name: string; position: number }>(
      "SELECT role_name, position FROM neiist.get_department_role_order($1)",
      [membership.departmentName]
    );
    const found = roleOrder.find((r) => normalize(r.role_name) === normalize(membership.roleName));
    if (found) {
      if (!highest || found.position < highest.position) {
        highest = { roleName: membership.roleName, position: found.position };
      }
    }
  }
  const positionName = highest?.roleName ?? memberships[0]?.roleName ?? null;
  return {
    ...mapdbUserToUser(user),
    positionName,
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const { rows } = await db_query<User>("SELECT * FROM neiist.get_all_users()");
  return rows.map(mapdbUserToUser);
};

export const addMember = async (
  istid: string,
  department = "Members",
  role = "Member"
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.add_department($1)", [department]);
    await db_query("SELECT neiist.add_team($1, $2)", [department, "General membership team"]);
    await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
      department,
      role,
      "member",
    ]);
  } catch {}
  await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, department, role]);
  return true;
};

export const addCollaborator = async (
  istid: string,
  teams: string[],
  position: string
): Promise<boolean> => {
  for (const team of teams) {
    try {
      await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
        team,
        position,
        "coordinator",
      ]);
    } catch {}
    await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, team, position]);
  }
  return true;
};

export const removeRole = async (
  istid: string,
  department: string,
  role: string
): Promise<boolean> => {
  await db_query("SELECT neiist.remove_team_member($1, $2, $3)", [istid, department, role]);
  return true;
};

export const getUsersByAccess = async (access: string): Promise<User[]> => {
  const { rows } = await db_query<User>(
    "SELECT istid, name, email, phone, courses, campus, photo_path as photo FROM neiist.get_users_by_access($1)",
    [access]
  );
  return rows.map(mapdbUserToUser);
};

export const getDepartmentRoles = async (
  departmentName: string
): Promise<Array<{ role_name: string; access: string; active: boolean }>> => {
  const { rows } = await db_query<{
    role_name: string;
    access: string;
    active: boolean;
  }>("SELECT role_name, access, active FROM neiist.get_department_roles($1)", [departmentName]);
  return rows;
};

export const addEmailVerification = async (
  istid: string,
  email: string,
  token: string,
  expiresAt: string
): Promise<void> => {
  await db_query("SELECT neiist.add_email_verification($1, $2, $3, $4)", [
    istid,
    email,
    token,
    expiresAt,
  ]);
};

export const getEmailVerification = async (
  token: string
): Promise<{ istid: string; email: string; expires_at: string } | null> => {
  const {
    rows: [row],
  } = await db_query<{ istid: string; email: string; expires_at: string }>(
    "SELECT * FROM neiist.get_email_verification($1)",
    [token]
  );
  return row ?? null;
};

export const deleteEmailVerification = async (token: string): Promise<void> => {
  await db_query("SELECT neiist.delete_email_verification($1)", [token]);
};

export const getEmailVerificationByUser = async (
  istid: string
): Promise<{ email: string; expires_at: string } | null> => {
  const {
    rows: [row],
  } = await db_query<{ email: string; expires_at: string }>(
    "SELECT * FROM neiist.get_email_verification_by_user($1)",
    [istid]
  );
  return row ?? null;
};

export const addDepartment = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.add_department($1)", [name]);
  return true;
};

export const removeDepartment = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.remove_department($1)", [name]);
  return true;
};

export const getAllDepartments = async (): Promise<
  Array<{ name: string; department_type: string; active: boolean }>
> => {
  const { rows } = await db_query<{ name: string; department_type: string; active: boolean }>(
    "SELECT * FROM neiist.get_all_departments()"
  );
  return rows;
};

export const addTeam = async (name: string, description: string): Promise<boolean> => {
  await db_query("SELECT neiist.add_team($1, $2)", [name, description]);
  return true;
};

export const removeTeam = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.remove_team($1)", [name]);
  return true;
};

export const getAllTeams = async (): Promise<
  Array<{ name: string; description: string; active: boolean }>
> => {
  const { rows } = await db_query<{
    name: string;
    description: string;
    active: boolean;
  }>("SELECT * FROM neiist.get_all_teams()");
  return rows;
};

export const addAdminBody = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.add_admin_body($1)", [name]);
  return true;
};

export const removeAdminBody = async (name: string): Promise<boolean> => {
  await db_query("SELECT neiist.remove_admin_body($1)", [name]);
  return true;
};

export const getAllAdminBodies = async (): Promise<Array<{ name: string; active: boolean }>> => {
  const { rows } = await db_query<{ name: string; active: boolean }>(
    "SELECT * FROM neiist.get_all_admin_bodies()"
  );
  return rows;
};

export const addValidDepartmentRole = async (
  departmentName: string,
  roleName: string,
  access: "admin" | "coordinator" | "member" = "member"
): Promise<boolean> => {
  await db_query("SELECT neiist.add_valid_department_role($1, $2, $3)", [
    departmentName,
    roleName,
    access,
  ]);
  return true;
};

export const removeValidDepartmentRole = async (
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  await db_query("SELECT neiist.remove_valid_department_role($1, $2)", [departmentName, roleName]);
  return true;
};

export const getAllValidDepartmentRoles = async (): Promise<
  Array<{
    department_name: string;
    role_name: string;
    access: string;
    active: boolean;
  }>
> => {
  const { rows } = await db_query<{
    department_name: string;
    role_name: string;
    access: string;
    active: boolean;
  }>("SELECT * FROM neiist.get_all_valid_department_roles()");
  return rows;
};

export const addTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  await db_query("SELECT neiist.add_team_member($1, $2, $3)", [istid, departmentName, roleName]);
  return true;
};

export const removeTeamMember = async (
  istid: string,
  departmentName: string,
  roleName: string
): Promise<boolean> => {
  await db_query("SELECT neiist.remove_team_member($1, $2, $3)", [istid, departmentName, roleName]);
  return true;
};

export const getAllMemberships = async (): Promise<Membership[]> => {
  const [dbMemberships, users] = await Promise.all([
    db_query<dbMembership>("SELECT * FROM neiist.get_all_memberships()").then((res) => res.rows),
    getAllUsers(),
  ]);
  return dbMemberships.map((raw, idx) => {
    const user = users.find((u) => u.istid === raw.user_istid);
    return mapdbMembershipToMembership(raw, user?.email || "", user?.photo || "", idx);
  });
};

export const getDepartmentRoleOrder = async (
  departmentName: string
): Promise<Array<{ role_name: string; position: number }>> => {
  const { rows } = await db_query<{ role_name: string; position: number }>(
    "SELECT * FROM neiist.get_department_role_order($1)",
    [departmentName]
  );
  return rows;
};

export const setDepartmentRoleOrder = async (
  departmentName: string,
  roles: string[]
): Promise<boolean> => {
  await db_query("SELECT neiist.set_department_role_order($1, $2)", [departmentName, roles]);
  return true;
};
