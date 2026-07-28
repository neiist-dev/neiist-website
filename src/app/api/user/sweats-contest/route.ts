import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Readable } from "stream";
import { getUserFromJWT } from "@/lib/auth";
import { getDriveClient } from "@/lib/google/drive";

const SWEATS_FOLDER_ID = process.env.GDRIVE_SWEATS_FOLDER_ID!;
const MAX_SUBMISSIONS = 3;
const CONTEST_ACTIVE = false;

if (!SWEATS_FOLDER_ID) throw new Error("Missing env: GDRIVE_SWEATS_FOLDER_ID");

function escapeDriveQueryString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function getUserSubmissions(username: string): Promise<Array<{ id: string; name: string }>> {
  const drive = getDriveClient();
  const safeUsername = escapeDriveQueryString(username);
  const res = await drive.files.list({
    q: `'${SWEATS_FOLDER_ID}' in parents and name contains '${safeUsername}_' and trashed=false`,
    fields: "files(id, name, createdTime)",
    spaces: "drive",
    orderBy: "createdTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return (res.data.files || []) as Array<{ id: string; name: string }>;
}

async function deleteOldestSubmission(submissions: Array<{ id: string; name: string }>) {
  const drive = getDriveClient();
  const oldestFile = submissions[submissions.length - 1];
  await drive.files.delete({ fileId: oldestFile.id, supportsAllDrives: true });
}

async function uploadSubmission(fileBuffer: Buffer, filename: string) {
  const drive = getDriveClient();
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const driveRes = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [SWEATS_FOLDER_ID],
      mimeType: "application/zip",
    },
    media: {
      mimeType: "application/zip",
      body: bufferStream,
    },
    fields: "id,webViewLink",
    supportsAllDrives: true,
  });

  return {
    fileId: driveRes.data.id!,
    link: driveRes.data.webViewLink!,
  };
}

async function getUsernameFromCookies(): Promise<string | null> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get("session")?.value;
  if (!sessionToken) return null;
  const jwtUser = getUserFromJWT(sessionToken);
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
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
    return NextResponse.json({ error: "Only ZIP files allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.slice(0, 2).toString("ascii") !== "PK") {
    return NextResponse.json({ error: "Only ZIP files allowed" }, { status: 400 });
  }

  if (buffer.length > 15 * 1024 * 1024) {
    return NextResponse.json(
      { error: "O ficheiro é demasiado grande (máx 15MB)" },
      { status: 413 }
    );
  }

  const existingSubmissions = await getUserSubmissions(username);
  if (existingSubmissions.length >= MAX_SUBMISSIONS) {
    await deleteOldestSubmission(existingSubmissions);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split(".")[0];
  const filename = `${username}_${timestamp}.zip`;

  try {
    const result = await uploadSubmission(buffer, filename);
    return NextResponse.json({
      success: true,
      ...result,
      submissionNumber: Math.min(existingSubmissions.length + 1, MAX_SUBMISSIONS),
      remainingSubmissions: Math.max(MAX_SUBMISSIONS - existingSubmissions.length - 1, 0),
    });
  } catch (err) {
    console.error("Error uploading submission:", err);
    return NextResponse.json({ error: "Failed to upload submission" }, { status: 500 });
  }
}
