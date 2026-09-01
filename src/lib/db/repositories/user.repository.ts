import { Membership, dbMembership, mapdbMembershipToMembership } from "@/types/memberships";
import { User, UserRole, mapRoleToUserRole, mapdbUserToUser } from "@/types/user";

import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";

export const createUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.istid || !user.name || !user.email) return null;
  const {
    rows: [newUser],
  } = await db_query<User>(
    `SELECT * FROM neiist.add_user($1::VARCHAR(10), $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT, $7::TEXT[])`,
    [user.istid, user.name, user.email, user.alternativeEmail, user.phone, user.photo, user.courses]
  );
  if (!newUser) return null;
  newUser.roles = newUser.roles?.map(mapRoleToUserRole);
  const result = newUser ? mapdbUserToUser(newUser) : null;
  if (result) revalidateTag("users", "max");
  return result;
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
  const result = updatedUser ? mapdbUserToUser(updatedUser) : null;
  if (result) revalidateTag("users", "max");
  return result;
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  await db_query("SELECT neiist.update_user_photo($1::VARCHAR(10), $2::TEXT)", [istid, photoData]);
  revalidateTag("users", "max");
  return true;
};

export const getUser = async (istid: string): Promise<User | null> => {
  "use cache";
  cacheTag("users");
  const {
    rows: [user],
  } = await db_query<User>("SELECT * FROM neiist.get_user($1::VARCHAR(10))", [istid]);
  if (!user) return null;

  const dbMemberships = (
    await db_query<dbMembership>("SELECT * FROM neiist.get_user_memberships($1::VARCHAR(10))", [
      istid,
    ])
  ).rows;

  const memberships: Membership[] = dbMemberships.map((raw, idx) =>
    mapdbMembershipToMembership(raw, user.email, user.photo, idx)
  );

  let positionName: string | null = memberships[0]?.roleName ?? null;
  const deptNames = Array.from(new Set(memberships.map((m) => m.departmentName).filter(Boolean)));
  if (deptNames.length > 0) {
    const { rows: roleOrders } = await db_query<{
      department_name: string;
      role_name: string;
      position: number;
    }>("SELECT * FROM neiist.get_department_role_orders($1::text[])", [deptNames]);

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    let highest: { roleName: string; position: number } | null = null;
    for (const membership of memberships) {
      const matchingOrders = roleOrders.filter(
        (role) => role.department_name === membership.departmentName
      );
      const found = matchingOrders.find(
        (role) => normalize(role.role_name) === normalize(membership.roleName)
      );
      if (found) {
        if (!highest || found.position < highest.position) {
          highest = { roleName: membership.roleName, position: found.position };
        }
      }
    }
    if (highest) positionName = highest.roleName;
  }

  return {
    ...mapdbUserToUser(user),
    positionName,
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  "use cache";
  cacheTag("users");
  const { rows } = await db_query<User>("SELECT * FROM neiist.get_all_users()");
  return rows.map(mapdbUserToUser);
};

export const getUsersByAccess = async (access: UserRole): Promise<User[]> => {
  "use cache";
  cacheTag("users");
  const { rows } = await db_query<{
    istid: string;
    name: string;
    email: string;
    phone?: string | null;
    courses?: string[];
    photo_path?: string;
    github?: string;
    linkedin?: string;
  }>(
    "SELECT istid, name, email, phone, courses, photo_path, github, linkedin FROM neiist.get_users_by_access($1)",
    [access]
  );
  return rows.map(mapdbUserToUser);
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
  revalidateTag("email_verifications", "max");
};

export const getEmailVerification = async (
  token: string
): Promise<{ istid: string; email: string; expires_at: string } | null> => {
  "use cache";
  cacheTag("email_verifications");
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
  revalidateTag("email_verifications", "max");
};

export const getEmailVerificationByUser = async (
  istid: string
): Promise<{ email: string; expires_at: string } | null> => {
  "use cache";
  cacheTag("email_verifications");
  const {
    rows: [row],
  } = await db_query<{ email: string; expires_at: string }>(
    "SELECT * FROM neiist.get_email_verification_by_user($1)",
    [istid]
  );
  return row ?? null;
};

export const deleteUser = async (
  istid: string
): Promise<{ success: boolean; was_member: boolean }> => {
  const {
    rows: [row],
  } = await db_query<{ success: boolean; was_member: boolean }>(
    `SELECT * FROM neiist.delete_user($1::VARCHAR(10))`,
    [istid]
  );
  const success = row?.success ?? false;
  if (success) {
    revalidateTag("users", "max");
    revalidateTag("memberships", "max");
    revalidateTag("email_verifications", "max");
  }
  return { success, was_member: row?.was_member ?? false };
};

export const removeDeletedUserOrdersPII = async (): Promise<void> => {
  await db_query(`SELECT neiist.remove_deleted_user_orders_pii()`);
};
