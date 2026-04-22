import cron from "node-cron";
import { autoCancelPendingOrders } from "@/utils/shop/autoCancelUtils";

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
  if (globalThis.__neiistAutoCancelScheduled) return;

  globalThis.__neiistAutoCancelScheduled = true;

  void runAutoCancel();
  cron.schedule(
    "0 * * * *",
    async () => {
      await runAutoCancel();
    },
    { timezone: "Europe/Lisbon" }
  );

  console.warn("[auto-cancel] scheduled every hour");
}

setupAutoCancel();

export {};
