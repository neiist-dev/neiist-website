import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@/types/user";
import { getUser, updateUser, updateUserPhoto } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";
import fs from "fs/promises";
import path from "path";

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    const updateData = await request.json();
    const { userId: targetUserId } = await params;

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const isAdmin = currentUserRoles.includes(UserRole._ADMIN);
    const isPhotoCoord =
      currentUserRoles.includes(UserRole._COORDINATOR) &&
      currentUser.teams?.some((team) => team.toLowerCase().includes("fotografia"));

    const isSelfUpdate = userData.istid === targetUserId;

    if (!isSelfUpdate && !(isAdmin || isPhotoCoord)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const existingUser = await getUser(targetUserId);
    if (!existingUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const updates: Partial<User> = {};

    if (updateData.alternativeEmail !== undefined) {
      const email = updateData.alternativeEmail.trim();
      if (email === "" || isValidEmail(email)) {
        updates.alternativeEmail = email || null;
      } else {
        return NextResponse.json({ error: "Email alternativo inválido" }, { status: 400 });
      }
    }

    if (updateData.phone !== undefined) {
      const phone = updateData.phone.trim();
      if (phone === "" || isValidPhone(phone)) {
        updates.phone = phone || null;
      } else {
        return NextResponse.json({ error: "Número de telefone inválido" }, { status: 400 });
      }
    }

    if (updateData.preferredContactMethod !== undefined) {
      const validMethods = ["email", "alternativeEmail", "phone"];
      if (validMethods.includes(updateData.preferredContactMethod)) {
        let dbContactMethod = updateData.preferredContactMethod;
        if (updateData.preferredContactMethod === "alternativeEmail") {
          dbContactMethod = "alternative_email";
        }
        updates.preferredContactMethod = dbContactMethod;
      } else {
        return NextResponse.json({ error: "Método de contacto inválido" }, { status: 400 });
      }
    }

    if (isAdmin) {
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

      if (updateData.courses !== undefined && Array.isArray(updateData.courses)) {
        updates.courses = updateData.courses;
      }
    }

    if (updateData.photo !== undefined && (isAdmin || isPhotoCoord)) {
      if (updateData.photo && updateData.photo !== existingUser.photo) {
        try {
          const buffer = Buffer.from(updateData.photo, "base64");
          const photoDir = path.join(process.cwd(), "data", "user_photos");
          await fs.mkdir(photoDir, { recursive: true });
          const filePath = path.join(photoDir, `${targetUserId}.png`);
          await fs.writeFile(filePath, buffer);
          // Save custom photo path to DB
          await updateUserPhoto(
            targetUserId,
            `/api/user/photo/${targetUserId}?custom&v=${Date.now()}`
          );
        } catch (photoError) {
          console.error("Error updating photo:", photoError);
          return NextResponse.json({ error: "Erro ao atualizar foto" }, { status: 500 });
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const updatedUser = await updateUser(targetUserId, updates);
      if (!updatedUser) {
        return NextResponse.json({ error: "Falha ao atualizar utilizador" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone number
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}
