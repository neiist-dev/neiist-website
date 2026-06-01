import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { loadEnvFile } from "node:process";

// Load environment variables
try {
  loadEnvFile();
} catch {
  // Ignore if .env file is missing
}

const FOLDER_ID = process.env.GDRIVE_BACKUP_FOLDER_ID!;

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

function getDriveClient() {
  const credentials = getServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const drive = getDriveClient();

  if (!FOLDER_ID) {
    console.error("Error: GDRIVE_BACKUP_FOLDER_ID not set");
    process.exit(1);
  }

  try {
    switch (command) {
      case "upload": {
        const [filePath, fileName] = args;
        const res = await drive.files.create({
          requestBody: { name: fileName, parents: [FOLDER_ID] },
          media: { body: fs.createReadStream(filePath) },
          supportsAllDrives: true,
        });
        console.log(res.data.id);
        break;
      }
      case "list": {
        const res = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and trashed = false`,
          fields: "files(id, name, createdTime)",
          orderBy: "createdTime desc",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        console.log(JSON.stringify(res.data.files));
        break;
      }
      case "delete": {
        const [fileId] = args;
        await drive.files.delete({ fileId, supportsAllDrives: true });
        break;
      }
      case "get": {
        const [fileId, destPath] = args;
        const res = await drive.files.get(
          { fileId, alt: "media", supportsAllDrives: true },
          { responseType: "stream" }
        );
        const dest = fs.createWriteStream(destPath);
        res.data.pipe(dest);
        await new Promise((resolve, reject) => {
          dest.on("finish", resolve);
          dest.on("error", reject);
        });
        break;
      }
      default:
        console.error("Unknown command:", command);
        process.exit(1);
    }
  } catch (err) {
    console.error("Drive Error:", (err as Error).message);
    process.exit(1);
  }
}

main();
