import jwt from "jsonwebtoken";
import { hasRequiredRole, mapRoleToUserRole, UserRole } from "@/types/user";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUser } from "@/utils/db/userQueries";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  istid: string;
  roles: UserRole[];
  name: string;
  email: string;
}

export function signUserJWT(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function getUserFromJWT(token: string | undefined): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

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
