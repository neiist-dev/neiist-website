import { NextRequest, NextResponse } from "next/server";
import ical from "ical-generator";
import type { ICalEventData } from "ical-generator";
import fs from "fs/promises";
import path from "path";
import { NotionApiResponse, NotionEvent, NotionPage } from "@/types/notion";
import { getUser } from "@/utils/dbUtils";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;
const CACHE_FILE = path.resolve(process.cwd(), "notion-events-cache.json");

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
    attendees: props.Attendees?.people?.map((p) => p.name ?? "") ?? [],
  };
}

async function fetchAllNotionEvents(): Promise<NotionEvent[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Failed to fetch Notion DB: " + txt);
  }

  const data: NotionApiResponse = await res.json();
  const results: NotionPage[] = data.results || [];
  const events = results.map(parseNotionPageToEvent);
  await saveCache(events);
  return events;
}

async function getNotionEvents(): Promise<NotionEvent[]> {
  const cached = await loadCache();
  if (cached && cached.length) return cached;

  return fetchAllNotionEvents();
}

async function generateICSForUser(email: string) {
  const events = await getNotionEvents();
  const cal = ical({ name: "User Events" });

  events
    .filter((event) => (event.type !== "Meeting" || event.attendees.includes(email)) && event.date)
    .forEach((event) => {
      const ev: ICalEventData = {
        id: event.id,
        summary: event.title,
        url: event.url,
        location: event.location.join(", ") || undefined,
        description: [
          event.url,
          event.type ? `Type: ${event.type}` : "",
          event.attendees.length ? `Attendees: ${event.attendees.join(", ")}` : "",
          event.teams.length ? `Teams: ${event.teams.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        categories: [{ name: event.type || "Event" }],
        start: new Date(event.date!),
      };
      if (event.end) ev.end = new Date(event.end);
      cal.createEvent(ev);
    });

  return cal.toString();
}

export async function GET(request: NextRequest) {
  try {
    const istid = request.nextUrl.searchParams.get("istid");
    if (!istid) {
      return new NextResponse("Missing istid", { status: 400 });
    }
    const user = await getUser(istid);
    if (!user?.email) {
      return new NextResponse("User not found", { status: 404 });
    }
    const icsData = await generateICSForUser(user.email);
    return new NextResponse(icsData, {
      status: 200,
      headers: { "Content-Type": "text/calendar" },
    });
  } catch (err) {
    console.error(err);
    return new NextResponse("Error generating calendar", { status: 500 });
  }
}
