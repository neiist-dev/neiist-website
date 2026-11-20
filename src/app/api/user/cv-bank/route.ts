import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  findUserCVFileId,
  removeUserCV,
  downloadUserCV,
  uploadUserCV,
} from "@/lib/m365/sharepointService";

export async function GET(request: NextRequest) {
  const isDownload = request.nextUrl.searchParams.has("download");
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const username = auth.user.istid;

  if (isDownload) {
    const buffer = await downloadUserCV(username);
    if (!buffer) return NextResponse.json({ error: "CV not found" }, { status: 404 });

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
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const removed = await removeUserCV(auth.user.istid);
  return NextResponse.json({ removed });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const username = auth.user.istid;

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
