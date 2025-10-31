import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs/promises";
import { getFirstAndLastName } from "@/utils/userUtils";

const CREDENTIALS_PATH = process.env.GOOGLE_CLIENT_SECRET_JSON!;
const TOKEN_PATH = process.env.GDRIVE_TOKEN_PATH!;
const SWEATS_FOLDER_ID = process.env.GDRIVE_SWEATS_FOLDER_ID!;

if (!CREDENTIALS_PATH) throw new Error("Missing env: GOOGLE_CLIENT_SECRET_JSON");
if (!TOKEN_PATH) throw new Error("Missing env: GDRIVE_TOKEN_PATH");
if (!SWEATS_FOLDER_ID) throw new Error("Missing env: GDRIVE_SWEATS_FOLDER_ID");

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

async function findUserSubmissionFileId(username: string): Promise<string | null> {
  const drive = await getGoogleDriveClient();
  const filename = `${username}.zip`;
  const safeName = escapeDriveQueryString(filename);
  const res = await drive.files.list({
    q: `'${SWEATS_FOLDER_ID}' in parents and name='${safeName}' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  if (Array.isArray(res.data.files) && res.data.files.length > 0 && res.data.files[0]?.id) {
    return res.data.files[0].id;
  }
  return null;
}

async function uploadSubmission(fileBuffer: Buffer, filename: string) {
  const drive = await getGoogleDriveClient();
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
  });

  return {
    fileId: driveRes.data.id!,
    link: driveRes.data.webViewLink!,
  };
}

async function getUsernameFromCookies(): Promise<string | null> {
  const reqCookies = await cookies();
  const userData = reqCookies.get("user_data")?.value;
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return getFirstAndLastName(user.name).toLowerCase().replace(/ /g, "_");
  } catch {
    return null;
  }
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

  const existingFileId = await findUserSubmissionFileId(username);
  if (existingFileId) {
    const drive = await getGoogleDriveClient();
    await drive.files.delete({ fileId: existingFileId });
  }

  const filename = `${username}.zip`;
  try {
    const result = await uploadSubmission(buffer, filename);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Error uploading submission:", err);
    return NextResponse.json({ error: "Failed to upload submission" }, { status: 500 });
  }
}
