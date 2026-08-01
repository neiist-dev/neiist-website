/**
 * Parses Google Service Account credentials from an environment variable.
 * Supports both raw JSON string and a base64-encoded one.
 */
function parseServiceAccountCredentials(value: string): object {
  const accountCredentials = value.trim();
  if (accountCredentials.startsWith("{")) return JSON.parse(accountCredentials);

  return JSON.parse(Buffer.from(accountCredentials, "base64").toString("utf8"));
}

/*
 * Get Google Service Account Credentials
 *
 * */
export function getServiceAccount(envName: string): object {
  const envValue = process.env[envName];
  if (!envValue) throw new Error("Missing env for Google Service Account");

  return parseServiceAccountCredentials(envValue);
}
