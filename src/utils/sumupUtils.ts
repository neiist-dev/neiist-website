import { NextResponse } from "next/server";
import SumUp from "@sumup/sdk";

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
 * Creates and returns a SumUp client instance.
 * Assumes credentials are already validated via validateSumUpCredentials().
 */
export function getSumUpClient(): SumUp {
  const apiKey = process.env.SUMUP_API_KEY!;
  return new SumUp({ apiKey });
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

/**
 * Returns a standardized JSON error response for SumUp operations.
 * All SumUp route errors use this consistent format.
 */
export function sumupErrorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  const body: Record<string, unknown> = {
    error: message,
    status,
  };

  if (details) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
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
