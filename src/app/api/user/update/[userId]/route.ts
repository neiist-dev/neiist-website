import { NextResponse } from "next/server";
import type { User } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { userPhotos } from "@/lib/imageStorage";
import { validateIstId, isValidEmail, isValidPhone } from "@/utils/apiValidationUtils";
import { getUser, updateUser, deleteUser } from "@/lib/db/repositories/user.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { getAccountDeletionTemplate } from "@/lib/email/templates/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [targetUserId, error] = validateIstId((await params).userId, "userId");
  if (error) return error;

  const updateData = await request.json();

  try {
    const currentUser = session.user;
    const existingUser = await getUser(targetUserId);
    if (!existingUser)
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    const isSelfUpdate = currentUser.istid === targetUserId;
    const canWriteUsers = hasPermission(currentUser, "users:write");
    const canWritePhotosGlobal = hasPermission(currentUser, "photos:write_global");
    const canWritePhotosDept =
      hasPermission(currentUser, "photos:write_dept") &&
      existingUser.teams?.some((team) =>
        hasPermission(currentUser, "photos:write_dept", { department: team })
      );
    const canWritePhoto = canWritePhotosGlobal || canWritePhotosDept;

    if (!isSelfUpdate && !canWriteUsers && !canWritePhoto)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const updates: Partial<User> = {};

    if (updateData.alternativeEmail !== undefined) {
      let email: string | null = updateData.alternativeEmail;
      if (typeof email !== "string") email = null;

      email = email?.trim?.() ?? null;
      if (email === null || email === "") {
        updates.alternativeEmail = null;
      } else if (isValidEmail(email)) {
        updates.alternativeEmail = email;
      } else {
        return NextResponse.json({ error: "Email alternativo inválido" }, { status: 400 });
      }
    }

    if (updateData.phone !== undefined) {
      let phone: string | null = updateData.phone;
      if (typeof phone !== "string") phone = null;

      phone = phone?.trim?.() ?? null;
      if (phone === null || phone === "") {
        updates.phone = null;
      } else if (isValidPhone(phone)) {
        updates.phone = phone;
      } else {
        return NextResponse.json({ error: "Número de telefone inválido" }, { status: 400 });
      }
    }

    if (updateData.preferredContactMethod !== undefined) {
      const validMethods = ["email", "alternativeEmail", "phone"];
      if (validMethods.includes(updateData.preferredContactMethod)) {
        let dbContactMethod = updateData.preferredContactMethod;
        if (updateData.preferredContactMethod === "alternativeEmail")
          dbContactMethod = "alternative_email";

        updates.preferredContactMethod = dbContactMethod;
      } else {
        return NextResponse.json({ error: "Método de contacto inválido" }, { status: 400 });
      }
    }

    if (updateData.github !== undefined) updates.github = updateData.github?.trim() || null;

    if (updateData.linkedin !== undefined) updates.linkedin = updateData.linkedin?.trim() || null;

    if (canWriteUsers) {
      if (updateData.name !== undefined) {
        const name = updateData.name.trim();
        if (name.length > 0) {
          updates.name = name;
        } else {
          return NextResponse.json({ error: "Nome não pode estar vazio" }, { status: 400 });
        }
      }

      if (updateData.email !== undefined) {
        const email = updateData.email.trim();
        if (isValidEmail(email)) {
          updates.email = email;
        } else {
          return NextResponse.json({ error: "Email principal inválido" }, { status: 400 });
        }
      }

      if (updateData.courses !== undefined && Array.isArray(updateData.courses))
        updates.courses = updateData.courses;
    }

    if (Object.keys(updates).length > 0) {
      const updatedUser = await updateUser(targetUserId, updates);
      if (!updatedUser)
        return NextResponse.json({ error: "Falha ao atualizar utilizador" }, { status: 500 });
    }

    revalidatePath("/about-us");
    revalidatePath("/management");
    revalidatePath("/profile");
    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [targetUserId, error] = validateIstId((await params).userId, "userId");
  if (error) return error;

  try {
    const currentUser = session.user;
    const canDeleteUsers = hasPermission(currentUser, "users:delete");
    const isSelfUpdate = currentUser.istid === targetUserId;

    if (!isSelfUpdate && !canDeleteUsers)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const existingUser = await getUser(targetUserId);
    if (!existingUser)
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    try {
      await sendEmail({
        to: existingUser.email,
        subject: "Confirmação de Eliminação de Conta - NEIIST",
        html: getAccountDeletionTemplate(existingUser.name),
      });
    } catch (emailError) {
      console.warn("Failed to send account deletion email:", emailError);
    }

    const { success, was_member: isMember } = await deleteUser(targetUserId);
    if (!success)
      return NextResponse.json({ error: "Falha ao eliminar utilizador" }, { status: 500 });

    if (!isMember) {
      await userPhotos.remove(targetUserId);
    }

    console.warn(
      JSON.stringify({
        event: "user_deleted",
        target_istid: targetUserId,
        deleted_by: currentUser.istid,
        was_member: isMember,
        initiated_by: isSelfUpdate ? "self" : "admin",
        at: new Date().toISOString(),
      })
    );

    revalidatePath("/about-us");
    revalidatePath("/management");
    revalidatePath("/profile");

    return NextResponse.json({
      success: true,
      message: "Utilizador eliminado com sucesso",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
