import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { UploadCVResult } from "./dto";

const credentials = JSON.parse(
  fs.readFileSync(path.resolve(process.env.GOOGLE_CLIENT_SECRET_JSON!), "utf8")
);
const token = JSON.parse(
  fs.readFileSync(path.resolve(process.env.GDRIVE_TOKEN_PATH!), "utf8")
);

const FOLDER_ID = process.env.GDRIVE_CV_FOLDER_ID!;

const oAuth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);
oAuth2Client.setCredentials(token);

const drive = google.drive({ version: "v3", auth: oAuth2Client });

export async function uploadCV(
  fileBuffer: Buffer,
  filename: string
): Promise<UploadCVResult> {
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

export async function findUserCVFileId(username: string): Promise<string | null> {
  const filename = `${username}.pdf`;
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name='${filename}' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  if (Array.isArray(res.data.files) && res.data.files.length > 0 && res.data.files[0]?.id) {
    return res.data.files[0].id;
  }
  return null;
}

export async function removeUserCV(username: string): Promise<boolean> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return false;
  await drive.files.delete({ fileId });
  return true;
}

export async function downloadUserCV(username: string): Promise<Buffer | null> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return null;
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}
