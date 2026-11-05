import cron from "node-cron";
import { removeDeletedUserOrdersPII } from "@/lib/db/repositories/user.repository";

// Global guard to only schedule once per process.
declare global {
  var __neiistDataRetentionScheduled: boolean | undefined;
}

function setupDataRetention() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalThis.__neiistDataRetentionScheduled) return;

  globalThis.__neiistDataRetentionScheduled = true;

  // Monthly 10-year GDPR data retention cleanup (1st of every month at 03:00)
  cron.schedule(
    "0 3 1 * *",
    async () => {
      await removeDeletedUserOrdersPII();
    },
    { timezone: "Europe/Lisbon" }
  );
  console.warn("[data-retention] scheduled monthly (1st of month at 03:00)");
}

setupDataRetention();

export {};
