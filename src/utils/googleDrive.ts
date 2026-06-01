import { google } from "googleapis";
import fs from "fs";
import path from "path";

function getServiceAccountCredentials() {
  const keyEnv = process.env.GDRIVE_SERVICE_ACCOUNT_KEY!;

  if (!keyEnv) {
    throw new Error("Missing env: GDRIVE_SERVICE_ACCOUNT_KEY");
  }

  if (keyEnv.endsWith(".json")) {
    const keyPath = path.resolve(process.cwd(), keyEnv);
    const keyContent = fs.readFileSync(keyPath, "utf8");
    return JSON.parse(keyContent);
  }
  return JSON.parse(keyEnv);
}

export function getDriveClient() {
  const serviceAccountKey = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}
