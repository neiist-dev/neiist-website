import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import {
  getDepartmentRoleOrder,
  setDepartmentRoleOrder,
} from "@/lib/db/repositories/team.repository";
import { serverCheckRoles } from "@/lib/auth";
import { canManageDepartment } from "@/lib/security/permissions";
import { handleApiError } from "@/utils/apiErrorUtils";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const department = request.nextUrl.searchParams.get("department");
  if (!department)
    return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });

  try {
    const order = await getDepartmentRoleOrder(department);
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { departmentName, roles } = await request.json();
  if (!departmentName || !Array.isArray(roles))
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

  const canManage = await canManageDepartment(
    userRoles.roles,
    userRoles.user?.istid,
    departmentName
  );
  if (!canManage) {
    return NextResponse.json(
      { error: "Insufficient permissions to manage role order in this department" },
      { status: 403 }
    );
  }

  try {
    const success = await setDepartmentRoleOrder(departmentName, roles);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
    }
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error);
  }
}
