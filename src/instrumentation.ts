// src/instrumentation.ts
// Next.js instrumentation hook — runs once when the server process starts.

import type { Instrumentation } from "next";

export async function register() {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const isServerRunning = process.env.NEXT_RUNTIME === "nodejs" && !isBuildPhase;
  if (isServerRunning) {

    await import("@/instrumentation.node");

    // MUST be initialized before any other import that uses those
    // modules, otherwise the instrumentation won't capture those calls.
    await import("@/lib/autoCancelScheduler");

    const { seedSpecialCategories } = await import("@/lib/db/repositories/shop.repository");
    await seedSpecialCategories();
  }
}

// ── Global server error handler ──
// Called by Next.js for uncaught errors in Server Components, Route Handlers,
// Server Actions, and Middleware. We route them through Pino so they get
// trace-correlated JSON output with full structured context.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Dynamic import to avoid loading pino in Edge runtime
  const { logger } = await import("@/lib/telemetry/logger");

  const message =
    err instanceof Error ? err.message : String(err);
  const digest =
    typeof err === "object" &&
    err !== null &&
    "digest" in err
      ? String((err as { digest: string }).digest)
      : undefined;

  logger.error(
    {
      err: err instanceof Error ? err : undefined,
      digest,
      request: {
        path: request.path,
        method: request.method,
        // Headers are intentionally omitted here to avoid PII leakage.
        // Pino redaction handles this for normal logs, but onRequestError
        // headers can contain authorization tokens and session cookies.
      },
      context: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
      },
    },
    `Uncaught server error: ${message}`,
  );
};
