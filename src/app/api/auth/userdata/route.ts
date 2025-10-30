import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import { getUser, createUser, getEmailVerificationByUser } from "@/utils/dbUtils";

type FenixRegistration = {
  degree?: {
    name?: { [locale: string]: string } | string | null;
    acronym?: string | null;
  } | null;
};

export async function GET() {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ error: "Not Authenticated." }, { status: 401 });

  try {
    const fenixResponse = await fetch("https://fenix.tecnico.ulisboa.pt/tecnico-api/v2/person", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!fenixResponse.ok) {
      const err = await fenixResponse.json().catch(() => ({}));
      return NextResponse.json({ error: "Invalid/Expired Token", details: err }, { status: 401 });
    }

    const info = await fenixResponse.json();

    const istid = info.username;
    const name = info.name ?? info.displayName;
    const email = info.email ?? info.institutionalEmail ?? null;
    const phone = info.phone ?? null;

    const registrations = (info?.roles?.student?.registrations ?? []) as FenixRegistration[];
    const courses: string[] = registrations
      .map((r) => {
        const nameField = r?.degree?.name;
        if (nameField && typeof nameField === "object") {
          return (
            nameField["pt-PT"] ??
            nameField["en-GB"] ??
            Object.values(nameField)[0] ??
            r?.degree?.acronym ??
            null
          );
        }
        return (nameField as string) ?? r?.degree?.acronym ?? null;
      })
      .filter((c): c is string => Boolean(c));

    let user = await getUser(istid);
    if (!user) {
      user = await createUser({ istid, name, email, phone, courses });
      if (!user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    if ((!user?.photo || !user.photo.includes("?custom")) && info.photo?.data) {
      const photoBuffer = Buffer.from(info.photo.data, "base64");
      const fenixDir = path.join(process.cwd(), "data", "fenix_cache");
      await fs.mkdir(fenixDir, { recursive: true });
      await fs.writeFile(path.join(fenixDir, `${user.istid}.png`), photoBuffer);
    }

    const notVerifiedEmail = await getEmailVerificationByUser(user.istid);
    if (notVerifiedEmail) {
      user.alternativeEmail = notVerifiedEmail.email;
      user.alternativeEmailVerified = false;
    } else {
      user.alternativeEmailVerified = true;
    }

    const resp = NextResponse.json(user);
    resp.cookies.set("user_data", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return resp;
  } catch (error) {
    console.error("Error in UserData API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
