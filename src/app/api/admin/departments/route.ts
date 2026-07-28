import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { addDepartment, removeDepartment, getAllDepartments } from "@/utils/db/userQueries";
import { serverCheckRoles } from "@/lib/auth";

export async function GET() {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
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

    const success = await addDepartment(name);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add department" }, { status: 500 });
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

    const success = await removeDepartment(name);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove department" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
