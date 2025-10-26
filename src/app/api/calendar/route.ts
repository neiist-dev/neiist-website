import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import fs from "fs/promises";
import path from "path";
import ical from "ical-generator";
import { ICalEventData } from "ical-generator";
import { NotionEvent, NotionPage, NotionApiResponse, NotionPerson } from "@/types/notion";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;
const CACHE_FILE = path.resolve(process.cwd(), "notion-events-cache.json");

const notion = new Client({ auth: NOTION_API_KEY });

function parseNotionPageToEvent(page: NotionPage): NotionEvent {
  const props = page.properties;
  return {
    id: page.id,
    title: props.Name?.title?.[0]?.plain_text || "Untitled Event",
    date: props.Date?.date?.start ?? null,
    end: props.Date?.date?.end ?? null,
    url: page.url,
    location: props.Location?.multi_select?.map((loc) => loc.name) ?? [],
    type: props.Type?.select?.name ?? null,
    teams: props.Teams?.multi_select?.map((t) => t.name) ?? [],
    attendees: props.Attendees?.people?.map((p: NotionPerson) => p.name ?? "") ?? [],
  };
}

async function loadCache(): Promise<NotionEvent[]> {
  try {
    const txt = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(txt) as NotionEvent[];
  } catch {
    return [];
  }
}

async function saveCache(events: NotionEvent[]) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(events, null, 2), "utf8");
}

async function fetchAllNotionEvents(): Promise<NotionEvent[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined = undefined;
  do {
    // @ts-expect-error Notion SDK types don't include 'query', even it exists on runtime.
    const response = (await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
    })) as NotionApiResponse;
    const mappedPages: NotionPage[] = response.results.map((page) => ({
      id: page.id,
      url: page.url,
      properties: page.properties,
    }));
    pages.push(...mappedPages);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  const events = pages.map(parseNotionPageToEvent);
  await saveCache(events);
  return events;
}

async function getNotionEvents(): Promise<NotionEvent[]> {
  const cached = await loadCache();
  if (cached && cached.length) return cached;
  return await fetchAllNotionEvents();
}

async function generateICSForUser(email: string) {
  const events = await getNotionEvents();
  const calendar = ical({ name: "User Events" });
  events
    .filter(
      (event) =>
        event.date &&
        (event.type !== "Meeting" || (event.type === "Meeting" && event.attendees.includes(email)))
    )
    .forEach((event) => {
      const ev: ICalEventData = {
        id: event.id,
        summary: event.title,
        url: event.url,
        location: event.location.length ? event.location.join(", ") : undefined,
        description: [
          event.url,
          event.type ? `Type: ${event.type}` : "",
          event.attendees.length ? `Attendees: ${event.attendees.join(", ")}` : "",
          event.teams.length ? `Teams: ${event.teams.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        categories: event.type ? [{ name: event.type }] : [{ name: "Event" }],
        start: new Date(event.date!),
      };
      if (event.end) ev.end = new Date(event.end);
      calendar.createEvent(ev);
    });

  return calendar.toString();
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return new NextResponse("Missing email", { status: 400 });
    }
    const ics = await generateICSForUser(email);
    return new NextResponse(ics, {
      headers: { "Content-Type": "text/calendar" },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
