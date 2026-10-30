// src/lib/telemetry/logger.ts
//
// Singleton Pino logger with:
//   - JSON output to stdout (for Alloy/pm2 to scrape)
//   - PII redaction (cookies, auth headers, passwords)
//   - pseudonymizeId() for GDPR-safe user ID logging
//
// The @opentelemetry/instrumentation-pino auto-instrumentation
// (loaded in instrumentation.node.ts) monkey-patches Pino at
// import time. Once patched, every log line emitted inside a
// traced span will automatically include:
//   { "trace_id": "abc123...", "span_id": "def456...", "trace_flags": "01" }
// You do NOT need to manually pass trace context to the logger.

import { createHmac } from "crypto";
import pino from "pino";

// ── PII Pseudonymization ──

const HMAC_KEY = process.env.OTEL_PSEUDONYMIZE_KEY || process.env.JWT_SECRET || "";

/**
 * Pseudonymizes an IST ID (e.g., "ist1199999") using HMAC-SHA256.
 *
 * Returns a deterministic but irreversible 12-character hex hash.
 * The same input always produces the same output within the same
 * deployment (same HMAC key), allowing log correlation across
 * requests without exposing the real student ID.
 *
 * Usage:
 *   logger.info({ userId: pseudonymizeId(user.istid) }, "User logged in");
 *
 * In Grafana, you can search for the pseudonymized ID to find all
 * traces and logs for a specific user without knowing their real ID.
 */
export function pseudonymizeId(istid: string): string {
  if (!istid) return "anon";
  return createHmac("sha256", HMAC_KEY)
    .update(istid)
    .digest("hex")
    .slice(0, 12);
}

// ── Logger Configuration ──

export const logger = pino({
  // Use ISO timestamps for consistent time parsing in Loki
  timestamp: pino.stdTimeFunctions.isoTime,

  // In development, use "debug" for verbose output.
  // In production, use "info" to reduce volume.
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Redaction: replace sensitive values with "[REDACTED]" in log output.
  // These paths match the structure of objects you pass to logger methods.
  // Example: logger.info({ headers: { cookie: "..." } }, "request")
  //   → { headers: { cookie: "[REDACTED]" }, msg: "request" }
  redact: {
    paths: [
      // HTTP headers that carry secrets
      "headers.cookie",
      "headers.Cookie",
      "headers.authorization",
      "headers.Authorization",
      "headers.set-cookie",
      "headers[\"set-cookie\"]",

      // Request/response objects that might carry auth data
      "req.headers.cookie",
      "req.headers.authorization",
      "res.headers[\"set-cookie\"]",

      // Common password/secret fields in arbitrary objects
      "password",
      "secret",
      "token",
      "accessToken",
      "access_token",
      "refreshToken",
      "refresh_token",
      "sessionToken",

      // Fénix-specific fields
      "client_secret",
    ],
    censor: "[REDACTED]",
  },

  // Base fields included in every log line
  base: {
    service: "neiist-website",
    // pid and hostname are added by Pino by default
  },

  // Format options
  formatters: {
    level(label) {
      // Output "level": "info" instead of "level": 30
      // This makes Loki label extraction simpler
      return { level: label };
    },
  },
});