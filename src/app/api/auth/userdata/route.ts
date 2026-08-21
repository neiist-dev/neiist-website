import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import { signUserJWT } from "@/lib/auth";
import { User } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import {
  getUser,
  createUser,
  updateUser,
  getEmailVerificationByUser,
} from "@/lib/db/repositories/user.repository";

import { FenixPersonResponse, extractCourses } from "@/types/fenix";

async function fetchFenixPerson(
  accessToken: string
): Promise<{ data?: FenixPersonResponse; error?: NextResponse }> {
  const fenixResponse = await fetch("https://fenix.tecnico.ulisboa.pt/tecnico-api/v2/person", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!fenixResponse.ok) {
    const details = await fenixResponse.json().catch(() => ({}));
    return {
      error: NextResponse.json({ error: "Invalid/Expired Token", details }, { status: 401 }),
    };
  }

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
  let user = await getUser(istid);

  if (!user) {
    user = await createUser({ istid, name, email, phone, courses });
    if (!user)
      user = (await updateUser(istid, { name, email, phone, courses })) ?? (await getUser(istid));
    return user;
  }

  const updates: Partial<User> = {};
  if (name && name !== user.name) updates.name = name;
  if (email && email !== user.email) updates.email = email;
  if (phone && phone !== user.phone) updates.phone = phone;

  const currentCourses = user.courses ?? [];
  if (
    courses.length > 0 &&
    (courses.length !== currentCourses.length || courses.some((c) => !currentCourses.includes(c)))
  ) {
    updates.courses = courses;
  }

  if (Object.keys(updates).length > 0) {
    const updated = await updateUser(istid, updates);
    if (updated) user = updated;
  }

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

function createSessionResponse(user: User): NextResponse {
  const response = NextResponse.json(user);
  const jwtPayload = {
    istid: user.istid,
    roles: user.roles,
    name: user.name,
    email: user.email,
  };
  const jwtToken = signUserJWT(jwtPayload);

  response.cookies.set("session", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return response;
}

export async function GET() {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ error: "Not Authenticated." }, { status: 401 });

  try {
    const { data: info, error } = await fetchFenixPerson(accessToken);
    if (error || !info)
      return error ?? NextResponse.json({ error: "Invalid/Expired Token" }, { status: 401 });

    const istid = info.username?.trim();
    if (!istid)
      return NextResponse.json({ error: "Missing username in Fénix profile" }, { status: 400 });

    const name = info.name ?? info.displayName ?? istid;
    const email = info.email ?? info.institutionalEmail ?? "";
    const phone = info.phone ?? null;
    const courses = extractCourses(info.roles?.student?.registrations ?? []);

    const user = await syncOrCreateUser({ istid, name, email, phone, courses });
    if (!user)
      return NextResponse.json({ error: "Failed to create or sync user" }, { status: 500 });

    await cacheFenixPhoto(user.istid, info.photo?.data, user.photo?.includes("?custom"));
    await attachEmailVerification(user);

    return createSessionResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
