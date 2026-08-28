import cron from "node-cron";
import { autoCancelPendingOrders } from "@/utils/shop/autoCancelUtils";
import { removeDeletedUserOrdersPII } from "@/lib/db/repositories/user.repository";

// Global guard to only schedule once per process.
declare global {
  var __neiistAutoCancelScheduled: boolean | undefined;
}

async function runAutoCancel() {
  try {
    await autoCancelPendingOrders();
  } catch (error) {
    console.error("[auto-cancel] failed", error);
  }
}

function setupAutoCancel() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalThis.__neiistAutoCancelScheduled) return;

  globalThis.__neiistAutoCancelScheduled = true;

  // Hourly pending order cancellation
  void runAutoCancel();
  cron.schedule(
    "0 * * * *",
    async () => {
      await runAutoCancel();
    },
    { timezone: "Europe/Lisbon" }
  );
  console.warn("[auto-cancel] scheduled every hour");

  // Monthly 10-year GDPR data retention cleanup (1st of every month at 03:00)
  void removeDeletedUserOrdersPII();
  cron.schedule(
    "0 3 1 * *",
    async () => {
      await removeDeletedUserOrdersPII();
    },
    { timezone: "Europe/Lisbon" }
  );
  console.warn("[data-retention] scheduled monthly (1st of month at 03:00)");
}

setupAutoCancel();

export {};
