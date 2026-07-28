import { google } from "googleapis";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

let _driveClient: ReturnType<typeof google.drive> | null = null;

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
  if (!_driveClient) {
    const serviceAccountKey = getServiceAccountCredentials();
    const auth = new google.auth.GoogleAuth({ credentials: serviceAccountKey, scopes: SCOPES });
    _driveClient = google.drive({ version: "v3", auth });
  }
  return _driveClient;
}
