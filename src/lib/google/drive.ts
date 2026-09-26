import { google } from "googleapis";
import { getServiceAccount } from "@/lib/google/serviceAccount";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

let _driveClient: ReturnType<typeof google.drive> | null = null;

export function getDriveClient(): ReturnType<typeof google.drive> | null {
  if (!_driveClient) {
    const serviceAccountKey = getServiceAccount("GDRIVE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) return null;
    const auth = new google.auth.GoogleAuth({ credentials: serviceAccountKey, scopes: SCOPES });
    _driveClient = google.drive({ version: "v3", auth });
  }
  return _driveClient;
}
