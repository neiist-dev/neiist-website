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
