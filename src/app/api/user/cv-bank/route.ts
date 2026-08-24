import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import {
  findUserCVFileId,
  removeUserCV,
  downloadUserCV,
  uploadUserCV,
} from "@/lib/google/driveService";

async function getUsernameFromCookies(): Promise<string | null> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get("session")?.value;
  if (!sessionToken) return null;
  const jwtUser = await verifyJWTWebCrypto(sessionToken);
  return jwtUser?.istid || null;
}

export async function GET(request: NextRequest) {
  const isDownload = request.nextUrl.searchParams.has("download");
  const username = await getUsernameFromCookies();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDownload) {
    const buffer = await downloadUserCV(username);
    if (!buffer) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${username}.pdf"`,
      },
    });
  }

  const fileId = await findUserCVFileId(username);
  if (!fileId) return NextResponse.json({ hasCV: false }, { status: 200 });

  return NextResponse.json({ hasCV: true, fileId }, { status: 200 });
}

export async function DELETE() {
  const username = await getUsernameFromCookies();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const removed = await removeUserCV(username);
  return NextResponse.json({ removed });
}

export async function POST(request: NextRequest) {
  const username = await getUsernameFromCookies();
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob))
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.type !== "application/pdf")
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.slice(0, 4).toString("ascii") !== "%PDF")
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });

  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "O ficheiro é demasiado grande (máx 10MB)" },
      { status: 413 }
    );
  }

  try {
    const result = await uploadUserCV(username, buffer);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error uploading CV:", err);
    return NextResponse.json({ error: "Failed to upload CV" }, { status: 500 });
  }
}
