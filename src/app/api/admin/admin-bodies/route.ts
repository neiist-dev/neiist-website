import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import {
  addAdminBody,
  removeAdminBody,
  getAllAdminBodies,
} from "@/lib/db/repositories/team.repository";
import { serverCheckRoles } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const adminBodies = await getAllAdminBodies();
    const transformedAdminBodies = adminBodies.map((adminBody) => ({
      ...adminBody,
      active: true, // Since getAllAdminBodies only returns active admin bodies
    }));
    return NextResponse.json(transformedAdminBodies);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const success = await addAdminBody(name);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add admin body" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const success = await removeAdminBody(name);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove admin body" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
