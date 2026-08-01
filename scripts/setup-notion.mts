import fs from "fs";
import path from "path";
import { loadEnvFile } from "node:process";
import { Client } from "@notionhq/client";
import { text, confirm, isCancel, cancel } from "@clack/prompts";

try {
  loadEnvFile();
} catch {
  // Ignore if .env missing
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
  const line = `${key}=${value}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    if (envContent && !envContent.endsWith("\n")) envContent += "\n";
    envContent += `${line}\n`;
  }
  fs.writeFileSync(ENV_PATH, envContent, "utf8");
}

async function main() {
  console.log("=========================================");
  console.log("     NEIIST Notion Setup & Verification  ");
  console.log("=========================================\n");

  let apiKey = process.env.NOTION_API_KEY || "";
  let databaseId = process.env.DATABASE_ID || "";
  let verificationToken = process.env.VERIFICATION_TOKEN || "";

  if (!apiKey || apiKey === "your_notion_secret") {
    const inputKey = await text({
      message: "Enter your Notion API Key (starts with ntn_ or secret_):",
    });
    if (isCancel(inputKey)) return cancel("Setup cancelled.");

    apiKey = inputKey as string;
    if (apiKey) updateEnvVar("NOTION_API_KEY", apiKey.trim());
  }

  if (!databaseId || databaseId === "your_database_id") {
    const inputDb = await text({
      message: "Enter your Notion Database ID (32 character hex string):",
    });
    if (isCancel(inputDb)) return cancel("Setup cancelled.");

    databaseId = inputDb as string;
    if (databaseId) updateEnvVar("DATABASE_ID", databaseId.trim());
  }

  if (!apiKey || !databaseId) {
    console.log("Notion API Key or Database ID missing. Skipping test query.");
  } else {
    console.log("\nTesting connection to Notion API...");
    try {
      const notion = new Client({ auth: apiKey.trim() });
      const response = await notion.dataSources.query({
        data_source_id: databaseId.trim(),
      });
      console.log(
        `Connection successful! Retrieved ${response.results.length} item(s) from Notion.`
      );
    } catch (err) {
      console.error("Notion connection failed:", (err as Error).message);
      const proceed = await confirm({
        message: "Would you like to continue configuring the Webhook Verification Token?",
      });
      if (isCancel(proceed) || !proceed) return cancel("Setup cancelled.");
    }
  }

  console.log("\n--- Webhook Verification Token Setup ---");
  const tokenInput = await text({
    message: "Enter your Notion Webhook Verification Token (or press Enter to skip):",
    initialValue:
      verificationToken && verificationToken !== "verification_token" ? verificationToken : "",
  });

  if (isCancel(tokenInput)) return cancel("Setup cancelled.");

  const inputToken = (tokenInput as string).trim();
  if (inputToken) {
    updateEnvVar("VERIFICATION_TOKEN", inputToken);
    console.log("Updated VERIFICATION_TOKEN in .env");
  } else {
    console.log("No VERIFICATION_TOKEN updated.");
  }

  console.log("\nNotion setup complete!");
}

main().catch((err) => {
  console.error("An error occurred during Notion setup:", err);
  process.exit(1);
});
