import { NextRequest, NextResponse } from "next/server";
import pLimit from "p-limit";
import { Client } from "@notionhq/client";
import crypto from "crypto";
import type { NotionPage, NotionApiResponse } from "@/types/notion";
import { mapNotionResultToPage } from "@/types/notion";
import type { NotionEvent } from "@/types/events";
import { syncAllEventsToCalendar, getCalendarClient } from "@/lib/google/calendar";
import { syncNotionEventsToDb } from "@/utils/eventsUtils";
import { parseNotionPageToEvent } from "@/utils/eventsUtils";
import { getAllUsers } from "@/utils/db/userQueries";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;

const notion = new Client({ auth: NOTION_API_KEY });

async function fetchAllNotionEvents(): Promise<NotionEvent[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response = (await notion.dataSources.query({
      data_source_id: DATABASE_ID,
      start_cursor: cursor,
    })) as unknown as NotionApiResponse;
    const mappedPages = response.results.map(mapNotionResultToPage);
    pages.push(...mappedPages);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages.map(parseNotionPageToEvent);
}

async function getExistingNEIISTCalendars() {
  const calendar = getCalendarClient();
  const response = await calendar.calendarList.list();
  const calendars = response.data.items || [];
  return calendars.filter((cal) => cal.summary?.startsWith("NEIIST-"));
}

async function syncAllEventsToGoogleCalendars(events: NotionEvent[]) {
  const allUsers = await getAllUsers();
  const existingCalendars = await getExistingNEIISTCalendars();
  const calendarByIstid = new Map<string, { id: string; summary: string }>();

  existingCalendars.forEach((cal) => {
    const istidMatch = cal.description?.match(/istid:([a-zA-Z0-9]+)/);
    if (istidMatch) {
      calendarByIstid.set(istidMatch[1], { id: cal.id!, summary: cal.summary! });
    }
  });

  const usersWithCalendars = allUsers.filter(
    (u) => u.email && u.istid && calendarByIstid.has(u.istid)
  );

  const limit = pLimit(2);

  const results = await Promise.all(
    usersWithCalendars.map((user) =>
      limit(async () => {
        try {
          const alternativeEmailRaw = user.alternativeEmailVerified
            ? user.alternativeEmail
            : undefined;
          const alternativeEmail = alternativeEmailRaw ?? undefined;
          const calendarId = calendarByIstid.get(user.istid)!.id;
          const stats = await syncAllEventsToCalendar(
            calendarId,
            events,
            user.email!,
            alternativeEmail
          );
          return stats;
        } catch (error) {
          console.error(`Error syncing calendar for ${user.istid}:`, error);
          return { updated: 0, deleted: 0, unchanged: 0 };
        }
      })
    )
  );

  return results.reduce(
    (acc, stat) => ({
      updated: acc.updated + stat.updated,
      deleted: acc.deleted + stat.deleted,
      unchanged: acc.unchanged + stat.unchanged,
    }),
    { updated: 0, deleted: 0, unchanged: 0 }
  );
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const verificationToken = process.env.VERIFICATION_TOKEN;

  if (verificationToken) {
    const signatureHeader =
      req.headers.get("X-Notion-Signature") || req.headers.get("x-notion-signature") || "";
    const calculatedSignature =
      "sha256=" +
      crypto.createHmac("sha256", verificationToken).update(bodyText, "utf8").digest("hex");
    try {
      if (
        !signatureHeader ||
        !crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signatureHeader))
      ) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } catch {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }

  try {
    const events = await fetchAllNotionEvents();
    const stats = await syncAllEventsToGoogleCalendars(events);
    await syncNotionEventsToDb();

    return NextResponse.json({
      ok: true,
      synced: true,
      eventCount: events.length,
      stats,
      message: `Synced: ${stats.updated} updated, ${stats.deleted} deleted, ${stats.unchanged} unchanged`,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Failed to sync calendars", { status: 500 });
  }
}
