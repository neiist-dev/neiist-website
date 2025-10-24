import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import fs from "fs/promises";

const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
const FOLDER_ID = process.env.GDRIVE_CV_FOLDER_ID!;
if (!SERVICE_ACCOUNT_JSON) throw new Error("Missing env: GOOGLE_SERVICE_ACCOUNT_JSON");
if (!FOLDER_ID) throw new Error("Missing env: GDRIVE_CV_FOLDER_ID");

type DriveFile = { id: string; name: string };
let cvFilesCache: { files: DriveFile[]; updatedAt: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  const credentials: { [key: string]: unknown } = JSON.parse(
    await fs.readFile(SERVICE_ACCOUNT_JSON, "utf8")
  );
  const scopes: string[] = ["https://www.googleapis.com/auth/drive"];
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes,
  });
  return google.drive({ version: "v3", auth });
}

async function getCVFiles(): Promise<DriveFile[]> {
  const now = Date.now();
  if (cvFilesCache && now - cvFilesCache.updatedAt < CACHE_TTL) {
    return cvFilesCache.files;
  }
  const drive = await getGoogleDriveClient();
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
    pageSize: 1000,
  });
  const files = (res.data.files ?? []).map((f) => ({ id: f.id!, name: f.name! }));
  cvFilesCache = { files, updatedAt: now };
  return files;
}

async function findUserCVFileId(username: string): Promise<string | null> {
  const filename = `${username}.pdf`;
  const files = await getCVFiles();
  const file = files.find((f) => f.name === filename);
  return file ? file.id : null;
}

async function removeUserCV(username: string): Promise<boolean> {
  const drive = await getGoogleDriveClient();
  const fileId = await findUserCVFileId(username);
  if (!fileId) return false;
  await drive.files.delete({ fileId });
  cvFilesCache = null;
  return true;
}

async function downloadUserCV(username: string): Promise<Buffer | null> {
  const drive = await getGoogleDriveClient();
  const fileId = await findUserCVFileId(username);
  if (!fileId) return null;
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  const data = res.data as ArrayBuffer;
  return Buffer.from(data);
}

type UploadCVResult = {
  fileId: string;
  link: string;
};

async function uploadCV(fileBuffer: Buffer, filename: string): Promise<UploadCVResult> {
  const drive = await getGoogleDriveClient();
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const driveRes = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [FOLDER_ID],
      mimeType: "application/pdf",
    },
    media: {
      mimeType: "application/pdf",
      body: bufferStream,
    },
    fields: "id,webViewLink",
  });
  cvFilesCache = null;

  return {
    fileId: driveRes.data.id ?? "",
    link: driveRes.data.webViewLink ?? "",
  };
}

async function getUsernameFromCookies(): Promise<string | null> {
  const reqCookies = await cookies();
  const userData = reqCookies.get("userData")?.value;
  if (!userData) return null;
  try {
    const user: { istid?: string; username?: string } = JSON.parse(userData);
    return user.istid || user.username || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const username = await getUsernameFromCookies();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.nextUrl.pathname.endsWith("/download")) {
    const buffer = await downloadUserCV(username);
    if (!buffer) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
    };
    if (!searchParams.get("preview")) {
      headers["Content-Disposition"] = `attachment; filename="${username}.pdf"`;
    }
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const uint8Array = new Uint8Array(arrayBuffer as ArrayBuffer);
    return new NextResponse(uint8Array, { headers });
  } else {
    const fileId = await findUserCVFileId(username);
    return NextResponse.json({ hasCV: Boolean(fileId) });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const username = await getUsernameFromCookies();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const removed = await removeUserCV(username);
  return NextResponse.json({ removed });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const username = await getUsernameFromCookies();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.slice(0, 4).toString("ascii") !== "%PDF") {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }
  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size of 10MB" }, { status: 413 });
  }

  await removeUserCV(username);
  const filename = `${username}.pdf`;
  try {
    const result = await uploadCV(buffer, filename);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error uploading CV:", err);
    return NextResponse.json({ error: "Failed to upload CV" }, { status: 500 });
  }
}
