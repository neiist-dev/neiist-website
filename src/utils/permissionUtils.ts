import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole, hasRequiredRole } from "@/types/user";
import { getUserFromJWT } from "@/utils/authUtils";

export async function serverCheckRoles(required: UserRole[]) {
  try {
    const sessionToken = (await cookies()).get("session")?.value;
    const jwtUser = getUserFromJWT(sessionToken);
    if (!jwtUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      };
    }

    const currentUser = await getUser(jwtUser.istid);
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
