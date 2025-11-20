import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/utils/dbUtils";
import {
  getOrCreateUserCalendar,
  getAddCalendarLink,
  getCalendarWebLink,
  syncEventsToCalendarBatched,
} from "@/utils/googleCalendar";
import { getFirstAndLastName } from "@/utils/userUtils";
import { Client } from "@notionhq/client";
import type { NotionPage, NotionApiResponse } from "@/types/notion";
import { mapNotionResultToPage } from "@/types/notion";
import type { NotionEvent } from "@/types/events";
import { parseNotionPageToEvent } from "@/utils/eventsUtils";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ istid: string }> }
) {
  try {
    const accessToken = (await cookies()).get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
    if (!userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }
    const { istid } = await params;
    if (!istid) {
      return new NextResponse("Missing istid", { status: 400 });
    }
    if (userData.istid !== istid) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }
    const user = await getUser(istid);
    if (!user || !user.email) {
      return new NextResponse("User not found or missing email", { status: 404 });
    }

    const alternativeEmailRaw = user.alternativeEmailVerified ? user.alternativeEmail : undefined;
    const alternativeEmail = alternativeEmailRaw ?? undefined;
    const calendarId = await getOrCreateUserCalendar(
      user.email,
      istid,
      user.name,
      alternativeEmail
    );

    const events = await fetchAllNotionEvents();
    const synced = await syncEventsToCalendarBatched(
      calendarId,
      events,
      user.email,
      alternativeEmail
    );

    const addCalendarLink = await getAddCalendarLink(calendarId);
    const webViewLink = await getCalendarWebLink(calendarId);

    const payload = {
      calendarId,
      calendarName: `NEIIST-${getFirstAndLastName(user.name)}`,
      addCalendarLink,
      webViewLink,
      sharedWith: [user.email, ...(alternativeEmail ? [alternativeEmail] : [])],
      eventsSynced: synced,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Calendar route error:", error);
    return new NextResponse(`Internal Server Error`, { status: 500 });
  }
}
