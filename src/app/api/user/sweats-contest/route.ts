import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { uploadSweatsSubmission } from "@/lib/m365/sharepointService";

const CONTEST_ACTIVE = false;

export async function POST(request: NextRequest) {
  if (!CONTEST_ACTIVE) {
    return NextResponse.json(
      { error: "O concurso está encerrado. Obrigado a todos os participantes!" },
      { status: 403 }
    );
  }

  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const username = auth.user.istid;

  const formData = await request.formData();
  const file = formData.get("file");
  const shareName = formData.get("shareName") === "true";

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
    const result = await uploadSweatsSubmission(username, buffer, shareName);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Error uploading submission:", err);
    return NextResponse.json({ error: "Failed to upload submission" }, { status: 500 });
  }
}
