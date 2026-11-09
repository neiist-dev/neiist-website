import { Client } from "@notionhq/client";
import type { NotionPage, NotionApiResponse, NotionPerson, NotionEvent } from "@/types/notion";
import { mapNotionResultToPage } from "@/types/notion";
import type { Activity } from "@/types/events";
import {
  createActivitiesEvent,
  updateActivitiesEvent,
  deleteActivitiesEvent,
  getActivitiesEventsFromDbRaw,
} from "@/lib/db/repositories/event.repository";
import { scheduleEventReminder, cancelEventReminder } from "@/lib/redis/queue";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;
const notion = new Client({ auth: NOTION_API_KEY });

export function parseNotionDates(
  dateStr?: string | null,
  endStr?: string | null
): { start: Date; end: Date; allDay: boolean } | null {
  if (!dateStr) return null;

  const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

  if (isAllDay) {
    const start = new Date(`${dateStr}T00:00:00Z`);
    const endBase = new Date(`${endStr ?? dateStr}T00:00:00Z`);
    const end = new Date(endBase.getTime() + 86_400_000);
    return { start, end, allDay: true };
  }

  const start = new Date(dateStr);
  const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3_600_000);
  return { start, end, allDay: false };
}

export const buildICalDatesFromNotion = (event: NotionEvent) =>
  parseNotionDates(event.date, event.end);

export function parseNotionPageToEvent(page: NotionPage): NotionEvent {
  const props = page.properties;
  const publicProp =
    props.Public?.checkbox ??
    (props as Record<string, { checkbox?: boolean }>)["Público"]?.checkbox ??
    (props as Record<string, { checkbox?: boolean }>)["Publico"]?.checkbox ??
    (props as Record<string, { checkbox?: boolean }>)["public"]?.checkbox ??
    true;

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
    public: publicProp,
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

export async function syncNotionEventsToDb(prefetchedEvents?: NotionEvent[]): Promise<{
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
}> {
  const notionEvents = prefetchedEvents ?? (await fetchAllNotionEvents());
  const dbEvents = await getActivitiesEventsFromDbRaw(false);

  const dbEventMap = new Map<string, Date | null>();
  for (const dbEvent of dbEvents) {
    if (dbEvent.sourceType === "website") continue;
    dbEventMap.set(dbEvent.id, dbEvent.lastEditedTime ?? null);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const event of notionEvents) {
    const dates = buildICalDatesFromNotion(event);
    if (!dates) continue;

    const existsInDb = dbEventMap.has(event.id);
    const dbLastEdited = dbEventMap.get(event.id);
    const notionLastEdited = new Date(event.lastEditedTime);
    const activityData: Partial<Activity> & { id: string } = {
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
      lastEditedTime: new Date(event.lastEditedTime),
      public: event.public,
    };

    if (!existsInDb) {
      await createActivitiesEvent(activityData);
      await scheduleEventReminder({
        id: event.id,
        start: { dateTime: dates.start.toISOString() },
      });
      created++;
    } else if (!dbLastEdited || notionLastEdited > dbLastEdited) {
      await updateActivitiesEvent(activityData);
      await scheduleEventReminder({
        id: event.id,
        start: { dateTime: dates.start.toISOString() },
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
    await cancelEventReminder(deletedId);
    deleted++;
  }

  return { created, updated, deleted, unchanged };
}
