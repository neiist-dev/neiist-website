import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection, NextResponse } from "next/server";
import { getUser } from "@/lib/db/repositories/user.repository";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { User } from "@/types/user";
import { UserRole } from "@/types/roles";
import { Permission } from "@/types/permissions";
import { hasPermission, PermissionCheckOptions } from "@/lib/security/permissions";

import { SESSION_COOKIE_NAME } from "@/lib/security/authSession";

export interface AuthSession {
  user: User;
  roles: UserRole[];
}

export type AuthResult =
  | { user: User; session: AuthSession; error?: undefined }
  | { error: NextResponse; user?: undefined; session?: undefined };

export const getAuthenticatedUser = cache(async (): Promise<AuthSession | null> => {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyJWTWebCrypto(token);
    if (!payload?.istid) return null;

    const user = await getUser(payload.istid);
    if (!user) return null;

    const roles = user.roles && user.roles.length > 0 ? user.roles : [UserRole._GUEST];
    return { user, roles };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
});

export async function verifyPermission(
  permission: Permission | Permission[],
  options?: PermissionCheckOptions
): Promise<AuthResult> {
  const session = await getAuthenticatedUser();
  if (!session)
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  if (!hasPermission(session.user, permission, options))
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };

  return { user: session.user, session };
}

export async function requireUser(redirectPath = "/unauthorized"): Promise<AuthSession> {
  const session = await getAuthenticatedUser();
  if (!session) redirect(redirectPath);
  return session;
}

export async function requirePermission(
  permission: Permission | Permission[],
  optionsOrRedirect?: PermissionCheckOptions | string
): Promise<AuthSession> {
  const redirectPath = typeof optionsOrRedirect === "string" ? optionsOrRedirect : "/unauthorized";
  const options = typeof optionsOrRedirect === "object" ? optionsOrRedirect : undefined;
  const session = await requireUser(redirectPath);

  if (!hasPermission(session.user, permission, options)) redirect(redirectPath);
  return session;
}
