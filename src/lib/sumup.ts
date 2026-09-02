import { NextResponse } from "next/server";
import SumUp from "@sumup/sdk";

export class SumUpAuthError extends Error {
  constructor(message = "SumUp API key is invalid or expired") {
    super(message);
    this.name = "SumUpAuthError";
  }
}

const globalForSumUp = globalThis as unknown as {
  sumupClient: SumUp | undefined;
};

/**
 * Validates that required SumUp environment variables are set.
 * Returns error response if missing, otherwise null.
 */
export function validateSumUpCredentials(): NextResponse | null {
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;

  if (!apiKey || !merchantCode) {
    console.error("Missing SUMUP_API_KEY or SUMUP_MERCHANT_CODE");
    return sumupErrorResponse("Payment service misconfigured", 500);
  }

  return null;
}

/**
 * Returns a SumUp client singleton anchored to globalThis.
 */
function getSumUpClient(): SumUp {
  if (!globalForSumUp.sumupClient) {
    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) throw new Error("SUMUP_API_KEY is missing");
    globalForSumUp.sumupClient = new SumUp({ apiKey });
  }
  return globalForSumUp.sumupClient;
}

/**
 * Runs an operation using the SumUp client singleton, translating 401/403 to SumUpAuthError.
 */
export async function withSumUp<T>(fn: (_client: SumUp) => Promise<T>): Promise<T> {
  const client = getSumUpClient();
  try {
    return await fn(client);
  } catch (err) {
    const status = getErrorStatus(err);
    if (status === 401 || status === 403) {
      throw new SumUpAuthError("SumUp API key is invalid or expired");
    }
    throw err;
  }
}

/**
 * Extracts HTTP status code from a SumUp API error object.
 * Handles nested response objects and defaults to 500.
 */
export function getErrorStatus(err: unknown): number {
  if (!err || typeof err !== "object") return 500;
  const e = err as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;

  const response = e.response as Record<string, unknown> | undefined;
  if (response && typeof response.status === "number") {
    return response.status;
  }

  return 500;
}

export function sumupErrorResponse(
  errOrMessage: unknown,
  status?: number,
  details?: Record<string, unknown>
): NextResponse {
  if (errOrMessage instanceof SumUpAuthError) {
    return NextResponse.json(
      { error: errOrMessage.message, status: 502, ...(details ? { details } : {}) },
      { status: 502 }
    );
  }

  const resolvedStatus =
    status ?? (typeof errOrMessage === "string" ? 400 : getErrorStatus(errOrMessage));
  const error =
    typeof errOrMessage === "string"
      ? errOrMessage
      : errOrMessage instanceof Error
        ? errOrMessage.message
        : "SumUp request failed";

  return NextResponse.json(
    { error, status: resolvedStatus, ...(details ? { details } : {}) },
    { status: resolvedStatus }
  );
}

/**
 * Formats an error object into a readable string for logging/display.
 */
export function formatSumUpError(err: unknown): string {
  if (!err) return "Unknown error";

  if (typeof err === "string") return err;

  if (err instanceof Error) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
