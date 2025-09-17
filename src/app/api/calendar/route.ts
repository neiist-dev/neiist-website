import { NextRequest, NextResponse } from "next/server";
import ical from "ical-generator";
import { getUser } from "@/utils/dbUtils";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;

type NotionPerson = { name: string; person?: { email?: string } };

type NotionPageProperties = {
  Name?: {
    title: { plain_text: string }[];
  };
  Date?: {
    date: { start: string | null; end: string | null };
  };
  Location?: {
    multi_select: { name: string }[];
  };
  Type?: {
    select: { name: string } | null;
  };
  Teams?: {
    multi_select: { name: string }[];
  };
  Attendees?: {
    people: NotionPerson[];
  };
  "Related Events"?: {
    relation: { id: string }[];
  };
};

type NotionPage = {
  id: string;
  url: string;
  properties: NotionPageProperties;
};

type NotionApiResponse = {
  results: NotionPage[];
};

type NotionEvent = {
  id: string;
  title: string;
  date: string | null;
  end: string | null;
  url: string;
  location: string[];
  type: string | null;
  teams: string[];
  attendees: string[];
};

async function getNotionEvents(): Promise<NotionEvent[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(errorText);
    throw new Error("Failed to fetch Notion data: " + errorText);
  }

  const data: NotionApiResponse = await res.json();

  return data.results.map((page): NotionEvent => {
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
  });
}

async function generateICSForUser(email: string) {
  const events = await getNotionEvents();
  const cal = ical({ name: "User Events" });

  events
    .filter((event) => event.type !== "Meeting" || event.attendees.includes(email))
    .forEach((event) => {
      cal.createEvent({
        id: event.id,
        start: new Date(event.date!),
        end: event.end ? new Date(event.end) : undefined,
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
      });
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
