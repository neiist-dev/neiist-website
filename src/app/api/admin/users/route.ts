import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllUsers, getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";

async function checkUserListPermission(): Promise<{
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
    const hasPermission = currentUserRoles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER].includes(role)
    );

    if (!hasPermission) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          {
            error: "Insufficient permissions - Member, Coordinator or Admin required",
          },
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
  const permissionCheck = await checkUserListPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
