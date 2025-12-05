import { NextRequest, NextResponse } from "next/server";
import {
  addValidDepartmentRole,
  removeValidDepartmentRole,
  getDepartmentRoles,
} from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";

export async function GET(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const department = request.nextUrl.searchParams.get("department");
    if (!department) {
      return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });
    }
    const roles = await getDepartmentRoles(department);
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const { departmentName, roleName, access } = await request.json();
    if (!departmentName || !roleName) {
      return NextResponse.json(
        { error: "Department name and role name are required" },
        { status: 400 }
      );
    }
    const success = await addValidDepartmentRole(departmentName, roleName, access);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const { departmentName, roleName } = await request.json();
    if (!departmentName || !roleName) {
      return NextResponse.json(
        { error: "Department name and role name are required" },
        { status: 400 }
      );
    }
    const success = await removeValidDepartmentRole(departmentName, roleName);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
  }
}
