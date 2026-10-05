import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/repositories/user.repository";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { User } from "@/types/user";
import { UserRole } from "@/types/roles";
import { Permission } from "@/types/permissions";
import { hasPermission } from "@/lib/security/permissions";

import { SESSION_COOKIE_NAME } from "@/lib/security/authSession";

export interface AuthSession {
  user: User;
  roles: UserRole[];
}

export type AuthResult =
  | { user: User; session: AuthSession; error?: undefined }
  | { error: NextResponse; user?: undefined; session?: undefined };

export type PermissionMatchMode = "all" | "any";

export interface VerifyPermissionOptions {
  department?: string;
  match?: PermissionMatchMode;
}

export const getAuthenticatedUser = cache(async (): Promise<AuthSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyJWTWebCrypto(token);
    if (!payload?.istid) return null;

    const user = await getUser(payload.istid as string);
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
  options?: VerifyPermissionOptions
): Promise<AuthResult> {
  const session = await getAuthenticatedUser();
  if (!session)
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const permissions = Array.isArray(permission) ? permission : [permission];
  const isAuthorized = (p: Permission): boolean =>
    hasPermission(session.user, p, { department: options?.department });

  const authorized =
    options?.match === "any" ? permissions.some(isAuthorized) : permissions.every(isAuthorized);

  if (!authorized)
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };

  return { user: session.user, session };
}

export async function requireUser(redirectPath = "/unauthorized"): Promise<AuthSession> {
  const session = await getAuthenticatedUser();
  if (!session) redirect(redirectPath);
  return session;
}

export async function requirePermission(
  permission: Permission,
  redirectPath = "/unauthorized"
): Promise<AuthSession> {
  const session = await requireUser();
  if (!hasPermission(session.user, permission)) redirect(redirectPath);
  return session;
}
