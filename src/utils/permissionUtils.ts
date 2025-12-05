import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole, hasRequiredRole } from "@/types/user";

export async function serverCheckRoles(required: UserRole[]) {
  try {
    const accessToken = (await cookies()).get("access_token")?.value;
    if (!accessToken) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      };
    }

    const userDataRaw = (await cookies()).get("user_data")?.value || "null";
    const userData = JSON.parse(userDataRaw);
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

    const currentUserRoles: UserRole[] = currentUser.roles?.map((r) => mapRoleToUserRole(r)) || [
      UserRole._GUEST,
    ];

    if (!hasRequiredRole(currentUserRoles, required)) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
      };
    }

    return { isAuthorized: true, user: currentUser, roles: currentUserRoles };
  } catch (err) {
    console.error("Error checking permissions:", err);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}
