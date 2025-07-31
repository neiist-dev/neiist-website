import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDepartmentRoleOrder, setDepartmentRoleOrder, getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";

async function checkAdminPermission(): Promise<{
  isAuthorized: boolean;
  error?: NextResponse;
}> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const hasPermissions =
      currentUserRoles.includes(UserRole._ADMIN) ||
      currentUserRoles.includes(UserRole._COORDINATOR);

    if (!hasPermissions) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Admin or Coordinator required" },
          { status: 403 }
        ),
      };
    }
    return { isAuthorized: true };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

export async function GET(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  const department = req.nextUrl.searchParams.get("department");
  if (!department) {
    return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });
  }
  const order = await getDepartmentRoleOrder(department);
  return NextResponse.json(order);
}

export async function POST(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  const { departmentName, roles } = await req.json();
  if (!departmentName || !Array.isArray(roles)) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const ok = await setDepartmentRoleOrder(departmentName, roles);
  return NextResponse.json({ ok });
}
