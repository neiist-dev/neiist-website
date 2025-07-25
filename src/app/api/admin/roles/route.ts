import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addValidDepartmentRole,
  removeValidDepartmentRole,
  getDepartmentRoles,
  getUser,
} from "@/utils/dbUtils";
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
  try {
    const department = req.nextUrl.searchParams.get("department");
    if (!department) {
      return NextResponse.json({ error: "Department parameter is required" }, { status: 400 });
    }
    const roles = await getDepartmentRoles(department);
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { departmentName, roleName, access } = await req.json();
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

export async function DELETE(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { departmentName, roleName } = await req.json();
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
