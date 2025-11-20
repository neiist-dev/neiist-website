import { Client } from "@notionhq/client";
import type { NotionPage, NotionApiResponse, NotionPerson } from "@/types/notion";
import { mapNotionResultToPage } from "@/types/notion";
import type { NotionEvent } from "@/types/events";
import {
  updateActivitiesEvent,
  deleteActivitiesEvent,
  getActivitiesEventsFromDb,
} from "@/utils/dbUtils";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;
const notion = new Client({ auth: NOTION_API_KEY });

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

function buildICalDatesFromNotion(event: NotionEvent) {
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

export function parseNotionPageToEvent(page: NotionPage): NotionEvent {
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
    attendees:
      props.Attendees?.people?.map((p: NotionPerson) => p.person?.email ?? "").filter(Boolean) ??
      [],
    lastEditedTime: page.last_edited_time,
    public: props.Public?.checkbox ?? true,
  };
}

export async function fetchAllNotionEvents(): Promise<NotionEvent[]> {
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

export async function syncNotionEventsToDb(): Promise<{
  updated: number;
  deleted: number;
  unchanged: number;
}> {
  const notionEvents = await fetchAllNotionEvents();
  const dbEvents = await getActivitiesEventsFromDb();
  const filteredNotionEvents = notionEvents.filter((e) => e.public);

  const dbEventMap = new Map<string, Date>();
  for (const dbEvent of dbEvents) {
    const lastEdited = dbEvent.extendedProperties?.private?.lastEditedTime;
    if (lastEdited) {
      dbEventMap.set(dbEvent.id, new Date(lastEdited));
    }
  }

  let updated = 0;
  let unchanged = 0;

  for (const event of filteredNotionEvents) {
    const dates = buildICalDatesFromNotion(event);
    if (!dates) continue;

    const dbLastEdited = dbEventMap.get(event.id);
    const notionLastEdited = new Date(event.lastEditedTime);

    if (!dbLastEdited || notionLastEdited > dbLastEdited) {
      await updateActivitiesEvent({
        id: event.id,
        title: event.title,
        description: "",
        url: event.url,
        location: event.location,
        type: event.type || "",
        teams: event.teams,
        attendees: event.attendees,
        start: dates.start,
        end: dates.end,
        allDay: dates.allDay,
        lastEditedTime: notionLastEdited,
      });
      updated++;
    } else {
      unchanged++;
    }

    dbEventMap.delete(event.id);
  }
  let deleted = 0;
  for (const deletedId of dbEventMap.keys()) {
    await deleteActivitiesEvent(deletedId);
    deleted++;
  }
  for (const event of notionEvents.filter((e) => !e.public)) {
    await deleteActivitiesEvent(event.id);
    deleted++;
  }

  return { updated, deleted, unchanged };
}
