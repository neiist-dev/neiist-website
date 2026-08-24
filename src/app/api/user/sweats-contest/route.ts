import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { uploadSweatsSubmission } from "@/lib/google/driveService";

const CONTEST_ACTIVE = false;

async function getUsernameFromCookies(): Promise<string | null> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get("session")?.value;
  if (!sessionToken) return null;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);
  return jwtUser?.istid || null;
}

export async function POST(request: NextRequest) {
  if (!CONTEST_ACTIVE) {
    return NextResponse.json(
      { error: "O concurso está encerrado. Obrigado a todos os participantes!" },
      { status: 403 }
    );
  }

  const username = await getUsernameFromCookies();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob))
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed")
    return NextResponse.json({ error: "Only ZIP files allowed" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.slice(0, 2).toString("ascii") !== "PK")
    return NextResponse.json({ error: "Only ZIP files allowed" }, { status: 400 });

  if (buffer.length > 15 * 1024 * 1024) {
    return NextResponse.json(
      { error: "O ficheiro é demasiado grande (máx 15MB)" },
      { status: 413 }
    );
  }

  try {
    const result = await uploadSweatsSubmission(username, buffer);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Error uploading submission:", err);
    return NextResponse.json({ error: "Failed to upload submission" }, { status: 500 });
  }
}
