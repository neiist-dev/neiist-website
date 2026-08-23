import { hasRequiredRole, mapRoleToUserRole, UserRole } from "@/types/user";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/repositories/user.repository";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";

export async function requireRoles(required: UserRole[], redirectPath = "/unauthorized") {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);

  if (!jwtUser) redirect("/api/auth/login");

  const currentUser = await getUser(jwtUser.istid);
  if (!currentUser) redirect("/api/auth/login");

  const currentUserRoles: UserRole[] = currentUser.roles?.map((r) => mapRoleToUserRole(r)) || [
    UserRole._GUEST,
  ];

  if (!hasRequiredRole(currentUserRoles, required)) redirect(redirectPath);

  return { user: currentUser, roles: currentUserRoles };
}

export async function serverCheckRoles(required: UserRole[]) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);

  if (!jwtUser)
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };

  try {
    const currentUser = await getUser(jwtUser.istid);
    if (!currentUser)
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };

    const currentUserRoles: UserRole[] = currentUser.roles?.map((r) => mapRoleToUserRole(r)) || [
      UserRole._GUEST,
    ];

    if (!hasRequiredRole(currentUserRoles, required))
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
      };

    return { isAuthorized: true, user: currentUser, roles: currentUserRoles };
  } catch (err) {
    console.error("Database error during role check:", err);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}
