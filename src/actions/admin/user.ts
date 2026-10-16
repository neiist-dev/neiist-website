"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import pool from "@/lib/db/connection";
import { deleteUser, getUser } from "@/lib/db/repositories/user.repository";
import { fenixPhotos, userPhotos } from "@/lib/imageStorage";
import { hasPermission } from "@/lib/security/permissions";
import { appendGdprTombstone } from "@/lib/security/gdpr";
import { sendEmail } from "@/lib/email";
import { getAccountDeletionTemplate } from "@/lib/email/templates/auth";

export async function deleteUserAction(
  istid: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getAuthenticatedUser();
  if (!session) throw new Error("Not authenticated");

  const currentUser = session.user;
  const canDeleteUsers = hasPermission(currentUser, "users:delete");
  const isSelf = currentUser.istid === istid;

  if (!isSelf && !canDeleteUsers) throw new Error("Insufficient permissions to delete user");

  const existingUser = isSelf ? currentUser : await getUser(istid);
  if (!existingUser) throw new Error("Target user not found");

  const client = await pool.connect();
  let isMember: boolean;
  try {
    await client.query("BEGIN");
    const { success, was_member } = await deleteUser(istid, client);
    if (!success) throw new Error("Failed to delete user in database");

    await appendGdprTombstone({
      istid,
      initiated_by: isSelf ? "user_request" : `admin:${currentUser.istid}`,
    });

    await client.query("COMMIT");
    isMember = was_member;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await fenixPhotos.remove(istid);
  if (!isMember) await userPhotos.remove(istid);

  try {
    await sendEmail({
      to: existingUser.email,
      subject: "Confirmação de Eliminação de Conta - NEIIST",
      html: getAccountDeletionTemplate(existingUser.name),
    });
  } catch (emailError) {
    console.warn("Failed to send account deletion email:", emailError);
  }

  console.warn(
    JSON.stringify({
      event: "user_deleted",
      deleted_by: currentUser.istid,
      was_member: isMember,
      initiated_by: isSelf ? "self" : "admin",
      at: new Date().toISOString(),
    })
  );

  revalidateTag("users", "max");
  revalidateTag("memberships", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  revalidatePath("/profile");

  return { success: true, message: "User deleted successfully" };
}
