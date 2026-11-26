import { NextResponse } from "next/server";
import type { User } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateIstId, isValidEmail, isValidPhone } from "@/utils/apiValidationUtils";
import { getUser, updateUser } from "@/lib/db/repositories/user.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [targetUserId, error] = validateIstId((await params).userId, "userId");
  if (error) return error;

  try {
    const updateData = await request.json();
    const currentUser = session.user;
    const isSelfUpdate = currentUser.istid === targetUserId;
    const existingUser = isSelfUpdate ? currentUser : await getUser(targetUserId);
    if (!existingUser)
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    const canWriteUsers = hasPermission(currentUser, "users:write");
    const canManageTargetMembership =
      hasPermission(currentUser, "memberships:write_global") ||
      Boolean(
        hasPermission(currentUser, "memberships:write_dept") &&
        existingUser.teams?.some((team) =>
          hasPermission(currentUser, "memberships:write_dept", { department: team })
        )
      );

    if (!isSelfUpdate && !canWriteUsers && !canManageTargetMembership)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const updates: Partial<User> = {};

    if (isSelfUpdate || canWriteUsers) {
      if (updateData.alternativeEmail !== undefined) {
        const rawEmail = updateData.alternativeEmail;
        const email = typeof rawEmail === "string" ? rawEmail.trim() : null;
        if (email === null || email === "") {
          updates.alternativeEmail = null;
        } else if (!canWriteUsers) {
          return NextResponse.json(
            { error: "A alteração do email alternativo requer verificação" },
            { status: 403 }
          );
        } else if (isValidEmail(email)) {
          updates.alternativeEmail = email;
        } else {
          return NextResponse.json({ error: "Email alternativo inválido" }, { status: 400 });
        }
      }

      if (updateData.phone !== undefined) {
        const rawPhone = updateData.phone;
        const phone = typeof rawPhone === "string" ? rawPhone.trim() : null;
        if (phone === null || phone === "") {
          updates.phone = null;
        } else if (isValidPhone(phone)) {
          updates.phone = phone;
        } else {
          return NextResponse.json({ error: "Número de telefone inválido" }, { status: 400 });
        }
      }

      if (updateData.preferredContactMethod !== undefined) {
        const validMethods = ["email", "alternativeEmail", "phone"] as const;
        if (
          typeof updateData.preferredContactMethod === "string" &&
          (validMethods as readonly string[]).includes(updateData.preferredContactMethod)
        ) {
          updates.preferredContactMethod =
            updateData.preferredContactMethod as User["preferredContactMethod"];
        } else {
          return NextResponse.json({ error: "Método de contacto inválido" }, { status: 400 });
        }
      }

      if (updateData.github !== undefined) {
        updates.github =
          typeof updateData.github === "string" ? updateData.github.trim() || null : null;
      }

      if (updateData.linkedin !== undefined) {
        updates.linkedin =
          typeof updateData.linkedin === "string" ? updateData.linkedin.trim() || null : null;
      }
    }

    if (canWriteUsers || canManageTargetMembership) {
      if (updateData.neiistEmail !== undefined) {
        const raw = typeof updateData.neiistEmail === "string" ? updateData.neiistEmail.trim() : "";
        if (!raw) {
          updates.neiistEmail = null;
        } else {
          const normalized = raw.toLowerCase();
          if (isValidEmail(normalized) && normalized.endsWith("@neiist.pt")) {
            updates.neiistEmail = normalized;
          } else {
            return NextResponse.json(
              { error: "Email NEIIST inválido (deve terminar em @neiist.pt)" },
              { status: 400 }
            );
          }
        }
      }
    }

    if (canWriteUsers) {
      if (updateData.name !== undefined) {
        const name = typeof updateData.name === "string" ? updateData.name.trim() : "";
        if (name.length > 0) {
          updates.name = name;
        } else {
          return NextResponse.json({ error: "Nome não pode estar vazio" }, { status: 400 });
        }
      }

      if (updateData.email !== undefined) {
        const email = typeof updateData.email === "string" ? updateData.email.trim() : "";
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
