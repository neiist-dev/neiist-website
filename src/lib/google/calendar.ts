import { google, type calendar_v3 } from "googleapis";
import type { Activity } from "@/types/events";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getServiceAccount } from "@/lib/google/serviceAccount";
import {
  getEventLastEditedIso,
  getValidEventUrl,
  normalizeUserEmails,
  shouldIncludeCalendarEvent,
} from "@/utils/calendarUtils";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 500;
const RETRY_DELAYS_MS = [500, 1500, 3500];
export const PUBLIC_CALENDAR_MARKER = "neiist:public";

let _calendarClient: ReturnType<typeof google.calendar> | null = null;
let _publicCalendarId: string | null = null;

export function getCalendarClient(): ReturnType<typeof google.calendar> | null {
  if (!_calendarClient) {
    const serviceAccountKey = getServiceAccount("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) return null;
    const auth = new google.auth.GoogleAuth({ credentials: serviceAccountKey, scopes: SCOPES });
    _calendarClient = google.calendar({ version: "v3", auth });
  }
  return _calendarClient;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimitError(error: unknown): boolean {
  const err = error as { status?: number; code?: number; message?: string };
  const status = err?.status ?? err?.code;
  return status === 429 || (status === 403 && /rate.?limit/i.test(err?.message ?? ""));
}

async function withGoogleRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= RETRY_DELAYS_MS.length) throw error;
      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }
}

export async function listServiceAccountCalendars(): Promise<
  calendar_v3.Schema$CalendarListEntry[]
> {
  const calendar = getCalendarClient();
  if (!calendar) return [];

  const items: calendar_v3.Schema$CalendarListEntry[] = [];
  let pageToken: string | undefined;

  while (true) {
    const { data } = await withGoogleRetry(() =>
      calendar.calendarList.list({ pageToken, maxResults: 250 })
    );
    if (data.items) items.push(...data.items);
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return items;
}

function buildGoogleCalendarDates(event: Activity) {
  if (!event.start || !event.end) return null;

  if (event.allDay) {
    return {
      start: { date: event.start.toISOString().split("T")[0] },
      end: { date: event.end.toISOString().split("T")[0] },
    };
  }

  return {
    start: { dateTime: event.start.toISOString(), timeZone: "UTC" },
    end: { dateTime: event.end.toISOString(), timeZone: "UTC" },
  };
}

async function ensurePublicReadAcl(
  calendar: NonNullable<ReturnType<typeof getCalendarClient>>,
  calendarId: string
): Promise<void> {
  try {
    await withGoogleRetry(() =>
      calendar.acl.insert({
        calendarId,
        requestBody: { role: "reader", scope: { type: "default" } },
      })
    );
  } catch (error) {
    console.error(`Failed to ensure public read ACL on calendar ${calendarId}:`, error);
  }
}

async function getOrCreateCalendar(
  marker: string,
  summary: string,
  description: string
): Promise<{ calendarId: string; created: boolean } | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const calendars = await listServiceAccountCalendars();
  const existing = calendars.find((cal) => cal.description?.includes(marker));

  if (existing?.id) {
    await ensurePublicReadAcl(calendar, existing.id);
    return { calendarId: existing.id, created: false };
  }

  const response = await withGoogleRetry(() =>
    calendar.calendars.insert({
      requestBody: { summary, description, timeZone: "Europe/Lisbon" },
    })
  );

  const calendarId = response.data.id!;
  await ensurePublicReadAcl(calendar, calendarId);
  return { calendarId, created: true };
}

export async function getOrCreatePublicCalendar(): Promise<{
  calendarId: string;
  created: boolean;
} | null> {
  if (_publicCalendarId) return { calendarId: _publicCalendarId, created: false };

  const result = await getOrCreateCalendar(
    PUBLIC_CALENDAR_MARKER,
    "NEIIST",
    `NEIIST Public Activities Calendar (${PUBLIC_CALENDAR_MARKER})`
  );
  if (result) _publicCalendarId = result.calendarId;
  return result;
}

export async function getOrCreateUserCalendar(
  istid: string,
  userName: string
): Promise<string | null> {
  const result = await getOrCreateCalendar(
    `istid:${istid}`,
    `NEIIST-${getFirstAndLastName(userName)}`,
    `NEIIST Calendar for ${userName} (istid:${istid})`
  );
  return result?.calendarId ?? null;
}

async function getExistingCalendarEvents(
  calendar: NonNullable<ReturnType<typeof getCalendarClient>>,
  calendarId: string
): Promise<Map<string, string>> {
  const response = await withGoogleRetry(() =>
    calendar.events.list({
      calendarId,
      maxResults: 2500,
      singleEvents: true,
      showDeleted: false,
    })
  );

  const eventMap = new Map<string, string>();
  for (const event of response.data.items || []) {
    if (!event.id) continue;
    const lastEdited =
      event.extendedProperties?.private?.notionLastEdited ||
      event.extendedProperties?.private?.lastEdited ||
      event.updated ||
      "";
    eventMap.set(event.id, lastEdited);
  }
  return eventMap;
}

async function upsertCalendarEvent(
  calendar: NonNullable<ReturnType<typeof getCalendarClient>>,
  calendarId: string,
  event: Activity,
  exists: boolean
) {
  const dates = buildGoogleCalendarDates(event);
  if (!dates) return;

  const googleEventId = event.id.replace(/-/g, "").substring(0, 64);
  const validUrl = getValidEventUrl(event);
  const lastEditedIso = getEventLastEditedIso(event);

  const requestBody = {
    id: googleEventId,
    summary: event.title,
    description: [
      validUrl,
      event.attendees.length ? `Attendees: ${event.attendees.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: event.location.length ? event.location.join(", ") : undefined,
    ...dates,
    ...(validUrl
      ? { source: { title: event.sourceType === "notion" ? "Notion" : "NEIIST", url: validUrl } }
      : {}),
    extendedProperties: {
      private: { notionLastEdited: lastEditedIso, lastEdited: lastEditedIso },
    },
  };

  const update = () =>
    withGoogleRetry(() =>
      calendar.events.update({ calendarId, eventId: googleEventId, requestBody })
    );
  const insert = () => withGoogleRetry(() => calendar.events.insert({ calendarId, requestBody }));

  try {
    await (exists ? update() : insert());
  } catch (error: unknown) {
    const status =
      (error as { status?: number; code?: number })?.status ?? (error as { code?: number })?.code;
    if (exists && status === 404) {
      await insert().catch((err) =>
        console.error(`Error inserting event after 404 ${googleEventId}:`, err)
      );
    } else if (!exists && status === 409) {
      await update().catch((err) =>
        console.error(`Error updating event after 409 ${googleEventId}:`, err)
      );
    } else {
      console.error(`Error syncing event ${googleEventId}:`, error);
    }
  }
}

async function deleteCalendarEvent(
  calendar: NonNullable<ReturnType<typeof getCalendarClient>>,
  calendarId: string,
  eventId: string
) {
  const googleEventId = eventId.replace(/-/g, "").substring(0, 64);
  try {
    await withGoogleRetry(() => calendar.events.delete({ calendarId, eventId: googleEventId }));
  } catch {
    // Event doesn't exist or already deleted
  }
}

export async function syncAllEventsToCalendar(
  calendarId: string,
  events: Activity[],
  userEmails?: string[]
) {
  const calendar = getCalendarClient();
  if (!calendar) return { updated: 0, deleted: 0, unchanged: events.length };

  const existingEvents = await getExistingCalendarEvents(calendar, calendarId);
  const userEmailSet = userEmails ? normalizeUserEmails(userEmails) : undefined;
  const staleEventIds = new Set(existingEvents.keys());
  const eventsToUpdate: Activity[] = [];

  for (const event of events) {
    if (!shouldIncludeCalendarEvent(event, userEmailSet)) continue;

    const googleEventId = event.id.replace(/-/g, "").substring(0, 64);
    const existingLastEdited = existingEvents.get(googleEventId);

    if (
      !existingLastEdited ||
      (event.lastEditedTime &&
        new Date(event.lastEditedTime).getTime() > new Date(existingLastEdited).getTime())
    ) {
      eventsToUpdate.push(event);
    }

    staleEventIds.delete(googleEventId);
  }

  const eventsToDelete = Array.from(staleEventIds);

  for (let i = 0; i < eventsToUpdate.length; i += BATCH_SIZE) {
    const batch = eventsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((event) => {
        const googleEventId = event.id.replace(/-/g, "").substring(0, 64);
        return upsertCalendarEvent(calendar, calendarId, event, existingEvents.has(googleEventId));
      })
    );
    if (i + BATCH_SIZE < eventsToUpdate.length) await delay(BATCH_DELAY_MS);
  }

  for (let i = 0; i < eventsToDelete.length; i += BATCH_SIZE) {
    const batch = eventsToDelete.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((eventId) => deleteCalendarEvent(calendar, calendarId, eventId)));
    if (i + BATCH_SIZE < eventsToDelete.length) await delay(BATCH_DELAY_MS);
  }

  return {
    updated: eventsToUpdate.length,
    deleted: eventsToDelete.length,
    unchanged: events.length - eventsToUpdate.length - eventsToDelete.length,
  };
}

export async function getAddCalendarLink(calendarId: string | null | undefined) {
  if (!calendarId) return "";
  return `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}&mode=WEEK`;
}
