import { google } from "googleapis";
import { loadEnvFile } from "node:process";
import enquirer from "enquirer";
const { MultiSelect, Confirm } = enquirer;

// Load environment variables
try {
  loadEnvFile();
} catch {
  // Ignore if .env file is missing
}

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function parseServiceAccountCredentials(value: string): object {
  const accountCredentials = value.trim();
  if (accountCredentials.startsWith("{")) return JSON.parse(accountCredentials);

  return JSON.parse(Buffer.from(accountCredentials, "base64").toString("utf8"));
}

function getServiceAccount(envName: string): object {
  const envValue = process.env[envName];
  if (!envValue) throw new Error("Missing env for Google Service Account");

  return parseServiceAccountCredentials(envValue);
}

async function getCalendarClient() {
  const serviceAccountKey = getServiceAccount("GOOGLE_SERVICE_ACCOUNT_KEY");
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: SCOPES,
  });
  return google.calendar({ version: "v3", auth });
}

async function main() {
  try {
    const calendar = await getCalendarClient();

    console.log("Fetching calendars...");
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    if (calendars.length === 0) {
      console.log("No calendars found for this service account.");
      return;
    }

    const choices = calendars.map((cal) => ({
      name: cal.id!,
      message: `${cal.summary} (${cal.id})`,
      value: cal.id,
    }));

    const prompt = new MultiSelect({
      name: "selected",
      message: "Select calendars to DELETE (Space to select, Enter to confirm)",
      choices: choices,
    });

    const selectedIds: string[] = await prompt.run();

    if (selectedIds.length === 0) {
      console.log("No calendars selected. Exiting.");
      return;
    }

    console.log("\nYou selected the following calendars for deletion:");
    selectedIds.forEach((id) => {
      const cal = calendars.find((c) => c.id === id);
      console.log(` - ${cal?.summary} (${id})`);
    });

    const confirmPrompt = new Confirm({
      name: "confirm",
      message: `Are you SURE you want to delete these ${selectedIds.length} calendars? This cannot be undone.`,
    });

    const confirmed = await confirmPrompt.run();

    if (!confirmed) {
      console.log("Deletion cancelled.");
      return;
    }

    console.log("\nDeleting calendars...");
    for (const id of selectedIds) {
      try {
        await calendar.calendars.delete({ calendarId: id });
        console.log(`Successfully deleted: ${id}`);
      } catch (err) {
        console.error(`Failed to delete ${id}:`, (err as Error).message);
      }
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("An error occurred:", (error as Error).message);
    process.exit(1);
  }
}

main();
