import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import {
  addValidDepartmentRole,
  removeValidDepartmentRole,
  getDepartmentRoles,
} from "@/lib/db/repositories/team.repository";
import { serverCheckRoles } from "@/lib/auth";
import { canManageDepartment, canAssignRoleAccess } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const department = request.nextUrl.searchParams.get("department");
  if (!department)
    return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });

  try {
    const roles = await getDepartmentRoles(department);
    return NextResponse.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { departmentName, roleName, access } = await request.json();
  if (!departmentName || !roleName) {
    return NextResponse.json(
      { error: "Department name and role name are required" },
      { status: 400 }
    );
  }

  const canManage = await canManageDepartment(
    userRoles.roles,
    userRoles.user?.istid,
    departmentName
  );
  if (!canManage) {
    return NextResponse.json(
      { error: "Insufficient permissions to manage roles in this department" },
      { status: 403 }
    );
  }

  if (!canAssignRoleAccess(userRoles.roles, access)) {
    return NextResponse.json(
      { error: "Insufficient permissions to assign the requested access level" },
      { status: 403 }
    );
  }

  try {
    const success = await addValidDepartmentRole(departmentName, roleName, access);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      revalidatePath("/team-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { departmentName, roleName } = await request.json();
  if (!departmentName || !roleName) {
    return NextResponse.json(
      { error: "Department name and role name are required" },
      { status: 400 }
    );
  }

  const canManage = await canManageDepartment(
    userRoles.roles,
    userRoles.user?.istid,
    departmentName
  );
  if (!canManage) {
    return NextResponse.json(
      { error: "Insufficient permissions to manage roles in this department" },
      { status: 403 }
    );
  }

  try {
    const success = await removeValidDepartmentRole(departmentName, roleName);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      revalidatePath("/team-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
