import { User, dbUser, mapdbUserToUser } from "@/types/user";

import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";
import { getUserMemberships, getAllDepartmentRoles } from "./team.repository";
import { compareMandatePower } from "@/utils/membershipSortUtils";

export const createUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.istid || !user.name || !user.email) return null;
  const {
    rows: [newUser],
  } = await db_query<dbUser>(
    `SELECT * FROM neiist.add_user($1::VARCHAR(10), $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT[])`,
    [user.istid, user.name, user.email, user.alternativeEmail, user.phone, user.courses]
  );
  if (!newUser) return null;
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
  const result = updatedUser ? mapdbUserToUser(updatedUser) : null;
  if (result) revalidateTag("users", "max");
  return result;
};

export const getUserNoCache = async (istid: string): Promise<User | null> => {
  const {
    rows: [user],
  } = await db_query<dbUser>("SELECT * FROM neiist.get_user($1::VARCHAR(10))", [istid]);
  if (!user) return null;
  return mapdbUserToUser(user);
};

export const getUser = async (istid: string): Promise<User | null> => {
  "use cache";
  cacheTag("users", "memberships", "department_roles");
  const user = await getUserNoCache(istid);
  if (!user) return null;

  const memberships = await getUserMemberships(istid, true);

  let positionName: string | null = null;
  if (memberships.length > 0) {
    const allRoles = await getAllDepartmentRoles();
    const sortedMemberships = [...memberships].sort((a, b) => compareMandatePower(a, b, allRoles));
    positionName = sortedMemberships[0]?.roleName ?? null;
  }

  return {
    ...user,
    positionName: positionName ?? undefined,
  };
};

export const getAllUsersNoCache = async (): Promise<User[]> => {
  const { rows } = await db_query<dbUser>("SELECT * FROM neiist.get_all_users()");
  return rows.map(mapdbUserToUser);
};

export const getAllUsers = async (): Promise<User[]> => {
  "use cache";
  cacheTag("users");
  return getAllUsersNoCache();
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
