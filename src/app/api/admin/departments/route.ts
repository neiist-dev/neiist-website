import { NextRequest, NextResponse } from "next/server";
import { addDepartment, removeDepartment, getAllDepartments } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";

export async function GET() {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "Failed to add department" }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "Failed to remove department" }, { status: 500 });
  }
}
