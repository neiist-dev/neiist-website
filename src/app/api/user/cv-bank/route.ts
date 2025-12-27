import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs/promises";
import { getUserFromJWT } from "@/utils/authUtils";

const CREDENTIALS_PATH = process.env.GOOGLE_CLIENT_SECRET_JSON!;
const TOKEN_PATH = process.env.GDRIVE_TOKEN_PATH!;
const FOLDER_ID = process.env.GDRIVE_CV_FOLDER_ID!;
if (!CREDENTIALS_PATH) throw new Error("Missing env: GOOGLE_CLIENT_SECRET_JSON");
if (!TOKEN_PATH) throw new Error("Missing env: GDRIVE_TOKEN_PATH");
if (!FOLDER_ID) throw new Error("Missing env: GDRIVE_CV_FOLDER_ID");

async function getGoogleDriveClient() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));
  const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf8"));
  const oAuth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
  oAuth2Client.setCredentials(token);
  return google.drive({ version: "v3", auth: oAuth2Client });
}

function escapeDriveQueryString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findUserCVFileId(username: string): Promise<string | null> {
  const drive = await getGoogleDriveClient();
  const filename = `${username}.pdf`;
  const safeName = escapeDriveQueryString(filename);
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name='${safeName}' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  if (Array.isArray(res.data.files) && res.data.files.length > 0 && res.data.files[0]?.id) {
    return res.data.files[0].id;
  }
  return null;
}

async function removeUserCV(username: string): Promise<boolean> {
  const drive = await getGoogleDriveClient();
  const fileId = await findUserCVFileId(username);
  if (!fileId) return false;
  await drive.files.delete({ fileId });
  return true;
}

async function downloadUserCV(username: string): Promise<Buffer | null> {
  const drive = await getGoogleDriveClient();
  const fileId = await findUserCVFileId(username);
  if (!fileId) return null;
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(res.data as ArrayBuffer);
}

async function uploadCV(fileBuffer: Buffer, filename: string) {
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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const username = await getUsernameFromCookies();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (url.searchParams.has("download")) {
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
  if (!fileId) {
    return NextResponse.json({ hasCV: false }, { status: 200 });
  }
  return NextResponse.json({ hasCV: true, fileId }, { status: 200 });
}

export async function DELETE() {
  const username = await getUsernameFromCookies();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const removed = await removeUserCV(username);
  return NextResponse.json({ removed });
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "O ficheiro é demasiado grande (máx 10MB)" },
      { status: 413 }
    );
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
