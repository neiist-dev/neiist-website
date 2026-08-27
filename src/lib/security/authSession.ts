import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { signJWTWebCrypto } from "@/lib/security/jwt";
import { User } from "@/types/user";
import {
  getUser,
  createUser,
  updateUser,
  getEmailVerificationByUser,
} from "@/lib/db/repositories/user.repository";
import { FenixPersonResponse, extractCourses } from "@/types/fenix";

export const SESSION_COOKIE_NAME = "session";

export function setSessionCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

async function fetchFenixPerson(
  accessToken: string
): Promise<{ data?: FenixPersonResponse; errorStatus?: number }> {
  const fenixResponse = await fetch("https://fenix.tecnico.ulisboa.pt/tecnico-api/v2/person", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!fenixResponse.ok) return { errorStatus: fenixResponse.status };

  return { data: await fenixResponse.json() };
}

async function syncOrCreateUser(params: {
  istid: string;
  name: string;
  email: string;
  phone: string | null;
  courses: string[];
}): Promise<User | null> {
  const { istid, name, email, phone, courses } = params;
  const user = await getUser(istid);

  if (!user) return createUser({ istid, name, email, phone, courses });

  const updates: Partial<User> = {};
  if (name && name !== user.name) updates.name = name;
  if (email && email !== user.email) updates.email = email;
  if (phone && phone !== user.phone) updates.phone = phone;

  const currentCourses = user.courses ?? [];
  const coursesChanged =
    courses.length > 0 &&
    (courses.length !== currentCourses.length || courses.some((c) => !currentCourses.includes(c)));

  if (coursesChanged) updates.courses = courses;

  if (Object.keys(updates).length > 0) return (await updateUser(istid, updates)) ?? user;

  return user;
}

async function cacheFenixPhoto(istid: string, photoData?: string, isCustom = false) {
  if (isCustom || !photoData) return;
  try {
    const photoBuffer = Buffer.from(photoData, "base64");
    const fenixDir = path.join(process.cwd(), "data", "fenix_cache");
    await fs.mkdir(fenixDir, { recursive: true });
    await fs.writeFile(path.join(fenixDir, `${istid}.png`), photoBuffer);
  } catch (error) {
    console.warn(`[Auth] Failed to cache Fenix photo for ${istid}:`, error);
  }
}

async function attachEmailVerification(user: User) {
  const notVerifiedEmail = await getEmailVerificationByUser(user.istid);
  if (notVerifiedEmail) {
    user.alternativeEmail = notVerifiedEmail.email;
    user.alternativeEmailVerified = false;
  } else {
    user.alternativeEmailVerified = true;
  }
}

/**
 * Fetches profile data from Fénix, creates or synchronizes the database user record.
 */
export async function syncFenixUserAndCreateSession(
  accessToken: string
): Promise<{ user: User; sessionToken: string } | null> {
  try {
    const { data: info, errorStatus } = await fetchFenixPerson(accessToken);
    if (errorStatus || !info) return null;

    const istid = info.username?.trim();
    if (!istid) return null;

    const name = info.name ?? info.displayName ?? istid;
    const email = info.email ?? info.institutionalEmail ?? "";
    const phone = info.phone ?? null;
    const courses = extractCourses(info.roles?.student?.registrations ?? []);

    const user = await syncOrCreateUser({ istid, name, email, phone, courses });
    if (!user) return null;

    await cacheFenixPhoto(user.istid, info.photo?.data, user.photo?.includes("?custom"));
    await attachEmailVerification(user);

    const jwtPayload = {
      istid: user.istid,
      roles: user.roles,
      name: user.name,
      email: user.email,
    };
    const sessionToken = await signJWTWebCrypto(jwtPayload);

    return { user, sessionToken };
  } catch (err) {
    console.error("[Auth] Error synchronizing Fénix user session:", err);
    return null;
  }
}
