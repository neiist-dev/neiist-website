import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/repositories/user.repository";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { hasRequiredRole, mapRoleToUserRole, UserRole, User } from "@/types/user";

export interface AuthSession {
  user: User;
  roles: UserRole[];
}

export type ApiAuthResult =
  ({ isAuthorized: true } & AuthSession) | { isAuthorized: false; error: NextResponse };

export const getAuthenticatedUser = cache(
  async function getAuthenticatedUser(): Promise<AuthSession | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const jwtUser = await verifyJWTWebCrypto(sessionToken);
    if (!jwtUser?.istid) return null;

    try {
      const user = await getUser(jwtUser.istid);
      if (!user) return null;

      const roles: UserRole[] = user.roles?.map((r) => mapRoleToUserRole(r)) || [UserRole._GUEST];
      return { user, roles };
    } catch (err) {
      console.error("[Auth] Database error during session lookup:", err);
      return null;
    }
  }
);

export async function requireUser(): Promise<AuthSession> {
  const session = await getAuthenticatedUser();
  if (!session) redirect("/api/auth/login");
  return session;
}

export async function requireRoles(
  required: [UserRole, ...UserRole[]] | UserRole[],
  redirectPath = "/unauthorized"
): Promise<AuthSession> {
  if (required.length === 0) return requireUser();
  const session = await requireUser();
  if (!hasRequiredRole(session.roles, required)) redirect(redirectPath);
  return session;
}

export async function serverCheckRoles(required: UserRole[] = []): Promise<ApiAuthResult> {
  const session = await getAuthenticatedUser();
  if (!session) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (required.length > 0 && !hasRequiredRole(session.roles, required)) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return { isAuthorized: true, user: session.user, roles: session.roles };
}
