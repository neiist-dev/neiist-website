import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import fs from "fs/promises";
import path from "path";
import ical from "ical-generator";
import { ICalEventData } from "ical-generator";
import { getUser } from "@/utils/dbUtils";
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
    attendees: props.Attendees?.people?.map((p: NotionPerson) => p.person?.email ?? "") ?? [],
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
    const response = (await notion.dataSources.query({
      data_source_id: DATABASE_ID,
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

function isDateOnly(s?: string | null) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addHours(date: Date, hours: number) {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

function buildICalDatesFromNotion(
  event: NotionEvent
): { start: Date; end: Date; allDay: boolean } | null {
  if (!event.date) return null;

  const startIsDateOnly = isDateOnly(event.date);
  const endExists = !!event.end;
  const endIsDateOnly = endExists && isDateOnly(event.end!);

  if (startIsDateOnly && !endExists) {
    const start = new Date(event.date + "T00:00:00Z");
    const end = addDays(start, 1);
    return { start, end, allDay: true };
  }

  if (startIsDateOnly && endIsDateOnly) {
    const start = new Date(event.date + "T00:00:00Z");
    const endDate = new Date(event.end! + "T00:00:00Z");
    const end = addDays(endDate, 1);
    return { start, end, allDay: true };
  }

  if (!startIsDateOnly && !endExists) {
    const start = new Date(event.date);
    const end = addHours(start, 1);
    return { start, end, allDay: false };
  }

  if (!startIsDateOnly && endExists && !endIsDateOnly) {
    const start = new Date(event.date);
    const end = new Date(event.end!);
    return { start, end, allDay: false };
  }

  return null;
}

async function generateICSForUser(email: string) {
  const events = await getNotionEvents();
  const calendar = ical({
    name: "NEIIST",
    prodId: { company: "neiist", product: "NEIIST Calendar", language: "EN" },
    timezone: "UTC",
  });

  events
    .filter(
      (event) =>
        event.date &&
        (event.type !== "Meeting" || (event.type === "Meeting" && event.attendees.includes(email)))
    )
    .forEach((event) => {
      const dates = buildICalDatesFromNotion(event);
      if (!dates) return;
      const ev: ICalEventData = {
        id: event.id,
        summary: event.title,
        url: event.url,
        location: event.location.length ? event.location.join(", ") : undefined,
        description: [
          event.url,
          event.attendees.length ? `Attendees: ${event.attendees.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        categories: event.type ? [{ name: event.type }] : [{ name: "Event" }],
        start: dates.start,
        end: dates.end,
      };

      if (dates.allDay) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        calendar.createEvent({ ...(ev as any), allDay: true } as any);
      } else {
        calendar.createEvent(ev);
      }
    });

  return calendar.toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ istid: string }> }
) {
  try {
    const { istid } = await params;

    if (!istid) {
      return new NextResponse("Missing istid", { status: 400 });
    }

    const user = await getUser(istid);
    if (!user || !user.email) {
      return new NextResponse("User not found or missing email", { status: 404 });
    }

    const ics = await generateICSForUser(user.email);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Security-Policy": "frame-ancestors *",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
