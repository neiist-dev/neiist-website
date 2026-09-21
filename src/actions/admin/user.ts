"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteUser, getUser } from "@/lib/db/repositories/user.repository";
import { hasPermission } from "@/lib/security/permissions";
import { getAccountDeletionTemplate, sendEmail } from "@/lib/email";

export async function deleteUserAction(
  istid: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getAuthenticatedUser();
  if (!session) throw new Error("Not authenticated");

  const currentUser = session.user;
  const canDeleteUsers = hasPermission(currentUser, "users:delete");
  const isSelf = currentUser.istid === istid;

  if (!isSelf && !canDeleteUsers) throw new Error("Insufficient permissions to delete user");

  const existingUser = await getUser(istid);
  if (!existingUser) throw new Error("Target user not found");

  try {
    await sendEmail({
      to: existingUser.email,
      subject: "Confirmação de Eliminação de Conta - NEIIST",
      html: getAccountDeletionTemplate(existingUser.name),
    });
  } catch (emailError) {
    console.warn("Failed to send account deletion email:", emailError);
  }

  const { success, was_member: isMember } = await deleteUser(istid);
  if (!success) throw new Error("Failed to delete user in database");

  if (!isMember) {
    try {
      const filePath = path.join(process.cwd(), "data", "user_photos", `${istid}.png`);
      await fs.unlink(filePath);
    } catch (unlinkError: unknown) {
      if ((unlinkError as NodeJS.ErrnoException)?.code !== "ENOENT")
        console.warn("Failed to delete user photo file:", unlinkError);
    }
  }

  revalidateTag("users", "max");
  revalidateTag("memberships", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  revalidatePath("/profile");

  return { success: true, message: "User deleted successfully" };
}
