import { NextRequest, NextResponse } from "next/server";
import { verifyPermission } from "@/lib/auth";
import { markEventAttendanceBatch } from "@/lib/db/repositories/event.repository";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyPermission("events:checkin");
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const { items } = await request.json();
    if (!Array.isArray(items))
      return NextResponse.json({ error: "Invalid payload: items array required" }, { status: 400 });

    const results: Array<{
      ticketCodeOrIstid: string;
      success: boolean;
      alreadyCheckedIn?: boolean;
      error?: string;
    }> = [];

    const CHUNK_SIZE = 50;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const codes: string[] = chunk
        .map(
          (item: { ticketCodeOrIstid?: string; ticketCode?: string; code?: string }) =>
            item.ticketCodeOrIstid || item.ticketCode || item.code
        )
        .filter((c: unknown): c is string => Boolean(c));

      if (codes.length > 0) {
        try {
          const batchResults = await markEventAttendanceBatch(id, codes, auth.user.istid);
          results.push(...batchResults);
        } catch (err) {
          for (const code of codes) {
            results.push({
              ticketCodeOrIstid: code,
              success: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }

      if (i + CHUNK_SIZE < items.length) await new Promise((resolve) => setImmediate(resolve));
    }

    const successfulCount = results.filter((r) => r.success || r.alreadyCheckedIn).length;

    return NextResponse.json({
      success: true,
      syncedCount: successfulCount,
      totalCount: items.length,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
