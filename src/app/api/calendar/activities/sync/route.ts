import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyPermission } from "@/lib/auth";
import { triggerDebouncedCalendarSync } from "@/lib/redis/queue";
import { syncNotionEventsToDb } from "@/utils/eventsUtils";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(_request: NextRequest) {
  const auth = await verifyPermission("events:write");
  if (auth.error) return auth.error;

  try {
    // Synchronously pull latest Notion events into PostgreSQL
    const stats = await syncNotionEventsToDb();

    revalidateTag("activities", "max");
    revalidatePath("/[locale]/activities/manage", "page");
    revalidatePath("/[locale]/activities", "page");

    // Queue Google Calendar background synchronization
    await triggerDebouncedCalendarSync("manual", 0);

    return NextResponse.json({
      success: true,
      stats,
      message: `Sincronização concluída: ${stats.created} criados, ${stats.updated} atualizados, ${stats.deleted} removidos, ${stats.unchanged} inalterados.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
