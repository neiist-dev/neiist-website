import fs from "fs";
import path from "path";
import { loadEnvFile } from "node:process";
import { select, text, isCancel } from "@clack/prompts";

try {
  loadEnvFile();
} catch {
  // Ignore if .env is missing
}

const ENV_PATH = path.resolve(process.cwd(), ".env");

function updateEnvVar(key: string, value: string) {
  let envContent: string;
  try {
    envContent = fs.readFileSync(ENV_PATH, "utf8");
  } catch {
    envContent = "";
  }

  const regex = new RegExp(`^${key}=.*$`, "m");

  const isJson = value.startsWith("{");
  const line = isJson ? `${key}='${value}'` : `${key}=${value}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    if (envContent && !envContent.endsWith("\n")) envContent += "\n";
    envContent += `${line}\n`;
  }
  fs.writeFileSync(ENV_PATH, envContent, "utf8");
}

function findJsonFiles(): string[] {
  const cwd = process.cwd();
  try {
    const files = fs.readdirSync(cwd);
    return files.filter(
      (f) =>
        f.endsWith(".json") && f !== "package.json" && f !== "tsconfig.json" && !f.startsWith(".")
    );
  } catch {
    return [];
  }
}

function validateAndEncodeJson(filePath: string): { encoded: string; parsed: any } | null {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(content);

    if (parsed.type !== "service_account")
      console.warn(`Warning: ${filePath} missing "type": "service_account".`);

    const minified = JSON.stringify(parsed);
    const encoded = Buffer.from(minified).toString("base64");

    return { encoded, parsed };
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, (err as Error).message);
    return null;
  }
}

async function configureKey(targetEnvVar: string, friendlyName: string): Promise<any | null> {
  console.log(`\n--- Configuring ${friendlyName} (${targetEnvVar}) ---`);

  const jsonFiles = findJsonFiles();
  let selectedPath: string | symbol;

  if (jsonFiles.length > 0) {
    selectedPath = await select({
      message: `Select JSON key file for ${friendlyName}:`,
      options: [
        ...jsonFiles.map((f) => ({ label: f, value: f })),
        { label: "Enter custom file path", value: "custom" },
        { label: "Skip", value: "skip" },
      ],
    });
  } else {
    selectedPath = await text({
      message: `Enter path to the ${friendlyName} JSON key file (or leave blank to skip):`,
    });
  }

  if (isCancel(selectedPath) || selectedPath === "skip" || !selectedPath) {
    console.log(`Skipping ${friendlyName} key setup.`);
    return null;
  }

  if (selectedPath === "custom") {
    selectedPath = await text({
      message: `Enter path to the JSON key file:`,
    });
    if (isCancel(selectedPath) || !selectedPath) return null;
  }

  const result = validateAndEncodeJson(selectedPath as string);
  if (result) {
    updateEnvVar(targetEnvVar, result.encoded);
    console.log(`Successfully stored ${targetEnvVar} in .env file (Base64 Encoded)!`);
    return result.parsed;
  }
  return null;
}

async function configureFolder(targetEnvVar: string, friendlyName: string) {
  const input = await text({
    message: `Paste the URL (or ID) for the ${friendlyName} (leave blank to skip):`,
  });

  if (isCancel(input) || !(input as string).trim()) {
    console.log(`Skipping ${friendlyName}.`);
    return;
  }

  const strInput = input as string;
  const match = strInput.match(/[-\w]{25,}/);
  const folderId = match ? match[0] : strInput.trim();

  updateEnvVar(targetEnvVar, folderId);
  console.log(`Extracted ID: ${folderId}`);
  console.log(`Saved ${targetEnvVar} to .env!`);
}

async function main() {
  console.log("==================================================");
  console.log("      Google Service Accounts Env Setup          ");
  console.log("==================================================");

  await configureKey("GOOGLE_SERVICE_ACCOUNT_KEY", "Google Calendar");
  const driveJson = await configureKey("GDRIVE_SERVICE_ACCOUNT_KEY", "Google Drive");

  let serviceAccountEmail = "";

  if (driveJson?.client_email) serviceAccountEmail = driveJson.client_email;

  console.log("\n==================================================");
  console.log("         Google Drive Folders Configuration       ");
  console.log("==================================================");
  console.log("\nPERMISSIONS REQUIRED:");
  console.log("You must share the target Google Drive folders with the service account email.");
  console.log(`1. Open the folder in Google Drive.`);
  console.log(`2. Click "Share".`);
  console.log(`3. Add the email below as an **Editor**:`);
  console.log(`\x1b[36m${serviceAccountEmail}\x1b[0m\n`);

  await configureFolder("GDRIVE_CV_FOLDER_ID", "CV Bank Folder");
  await configureFolder("GDRIVE_SWEATS_FOLDER_ID", "Sweats Design Folder");
  await configureFolder("GDRIVE_BACKUP_FOLDER_ID", "Database Backups Folder");

  console.log("\nService Account & Google Drive setup complete!");
}

main().catch((err) => {
  console.error("An error occurred:", err);
  process.exit(1);
});
