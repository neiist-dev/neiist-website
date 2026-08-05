import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { getDepartmentRoleOrder, setDepartmentRoleOrder } from "@/utils/db/userQueries";
import { serverCheckRoles } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET(request: NextRequest) {
  try {
    const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
    if (!userRoles.isAuthorized) {
      return userRoles.error;
    }
    const department = request.nextUrl.searchParams.get("department");
    if (!department) {
      return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });
    }
    const order = await getDepartmentRoleOrder(department);
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
    if (!userRoles.isAuthorized) {
      return userRoles.error;
    }
    const { departmentName, roles } = await request.json();
    if (!departmentName || !Array.isArray(roles)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    const ok = await setDepartmentRoleOrder(departmentName, roles);
    return NextResponse.json({ ok });
  } catch (error) {
    return handleApiError(error);
  }
}
