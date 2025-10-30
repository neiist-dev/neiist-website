import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addDepartment, removeDepartment, getAllDepartments, getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";

async function checkAdminPermission(): Promise<{
  isAuthorized: boolean;
  error?: NextResponse;
}> {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
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
    const isAdmin = currentUserRoles.includes(UserRole._ADMIN);

    if (!isAdmin) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Admin required" },
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

export async function GET() {
  const permissionCheck = await checkAdminPermission();
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

export async function POST(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { name } = await req.json();
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

export async function DELETE(req: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const { name } = await req.json();
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
