import { getGraphClient, isM365Configured } from "@/lib/m365/graph";
import {
  getEventLastEditedIso,
  getValidEventUrl,
  normalizeUserEmails,
  shouldIncludeCalendarEvent,
} from "@/utils/calendarUtils";
import { getRedisClient } from "@/lib/redis/client";
import { RELEASE_LOCK_LUA } from "@/lib/redis/scripts";
import type { Activity } from "@/types/events";

const EXT_PROP_GUID = "{66f5a359-4659-4830-9070-00047ec972c0}";
const PROP_EVENT_ID = `String ${EXT_PROP_GUID} Name neiistEventId`;
const PROP_LAST_EDITED = `String ${EXT_PROP_GUID} Name neiistLastEdited`;
const OUTLOOK_LOCK_TTL_SECONDS = 120;

interface GraphExtendedProperty {
  id: string;
  value?: string;
}

interface GraphEvent {
  id: string;
  singleValueExtendedProperties?: GraphExtendedProperty[];
}

async function withOutlookMailboxLock<T>(neiistEmail: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();
  const lockKey = `events:outlook:lock:${neiistEmail.trim().toLowerCase()}`;
  const lockId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  let acquired = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await redis.set(lockKey, lockId, "EX", OUTLOOK_LOCK_TTL_SECONDS, "NX");
    if (res === "OK") {
      acquired = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!acquired) throw new Error(`Timed out waiting for Outlook sync lock for ${neiistEmail}`);

  try {
    return await fn();
  } finally {
    await redis.eval(RELEASE_LOCK_LUA, 1, lockKey, lockId).catch(() => {});
  }
}

function toGraphDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildOutlookDates(event: Activity) {
  if (!event.start || !event.end) return null;

  if (event.allDay) {
    const startStr = toGraphDateStr(event.start);
    let endDate = new Date(event.end);
    if (toGraphDateStr(endDate) <= startStr) {
      endDate = new Date(event.start);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
    }
    const endStr = toGraphDateStr(endDate);
    return {
      isAllDay: true,
      start: { dateTime: `${startStr}T00:00:00`, timeZone: "Europe/Lisbon" },
      end: { dateTime: `${endStr}T00:00:00`, timeZone: "Europe/Lisbon" },
    };
  }

  return {
    isAllDay: false,
    start: { dateTime: event.start.toISOString().replace("Z", ""), timeZone: "UTC" },
    end: { dateTime: event.end.toISOString().replace("Z", ""), timeZone: "UTC" },
  };
}

function buildOutlookEventPayload(event: Activity) {
  const dates = buildOutlookDates(event);
  if (!dates) return null;

  const validUrl = getValidEventUrl(event);
  const lastEditedIso = getEventLastEditedIso(event);

  const bodyLines = [
    validUrl ? `<p><a href="${validUrl}">${validUrl}</a></p>` : "",
    event.attendees.length ? `<p>Attendees: ${event.attendees.join(", ")}</p>` : "",
  ].filter(Boolean);

  return {
    subject: event.title,
    body: {
      contentType: "HTML",
      content: bodyLines.join("") || "",
    },
    location: event.location.length ? { displayName: event.location.join(", ") } : undefined,
    ...dates,
    singleValueExtendedProperties: [
      { id: PROP_EVENT_ID, value: event.id },
      { id: PROP_LAST_EDITED, value: lastEditedIso },
    ],
  };
}

async function listExistingOutlookEvents(
  neiistEmail: string
): Promise<Map<string, { graphId: string; lastEdited?: string }>> {
  const client = getGraphClient();
  const eventsBase = `/users/${encodeURIComponent(neiistEmail)}/calendar/events`;
  const expandFilter = `id eq '${PROP_EVENT_ID}' or id eq '${PROP_LAST_EDITED}'`;
  const eventFilter = `singleValueExtendedProperties/Any(ep: ep/id eq '${PROP_EVENT_ID}' and ep/value ne null)`;
  const map = new Map<string, { graphId: string; lastEdited?: string }>();

  let nextUrl: string | null =
    `${eventsBase}?$top=500&$select=id&$filter=${encodeURIComponent(eventFilter)}&$expand=singleValueExtendedProperties($filter=${encodeURIComponent(expandFilter)})`;

  while (nextUrl) {
    const res = await client.api(nextUrl).get();
    const items: GraphEvent[] = res?.value ?? [];
    for (const item of items) {
      const props = item.singleValueExtendedProperties ?? [];
      const neiistId = props.find((p) => p.id === PROP_EVENT_ID)?.value;
      const lastEdited = props.find((p) => p.id === PROP_LAST_EDITED)?.value;
      if (neiistId) map.set(neiistId, { graphId: item.id, lastEdited });
    }
    nextUrl = res?.["@odata.nextLink"] ?? null;
  }

  return map;
}

export async function deleteOutlookSyncedEvents(neiistEmail: string): Promise<void> {
  if (!isM365Configured() || !neiistEmail) return;

  await withOutlookMailboxLock(neiistEmail, async () => {
    const client = getGraphClient();
    const eventsBase = `/users/${encodeURIComponent(neiistEmail)}/calendar/events`;
    const existingMap = await listExistingOutlookEvents(neiistEmail);

    for (const existing of existingMap.values()) {
      await client.api(`${eventsBase}/${encodeURIComponent(existing.graphId)}`).delete();
    }
  });
}

export async function syncAllEventsToOutlookCalendar(
  neiistEmail: string,
  events: Activity[],
  userEmails: Array<string | undefined | null>
): Promise<{ updated: number; deleted: number }> {
  if (!isM365Configured() || !neiistEmail) {
    return { updated: 0, deleted: 0 };
  }

  return withOutlookMailboxLock(neiistEmail, async () => {
    const client = getGraphClient();
    const eventsBase = `/users/${encodeURIComponent(neiistEmail)}/calendar/events`;
    const userEmailSet = normalizeUserEmails(userEmails);

    const existingMap = await listExistingOutlookEvents(neiistEmail);
    const desiredIds = new Set<string>();
    let updated = 0;
    let deleted = 0;

    for (const event of events) {
      if (!shouldIncludeCalendarEvent(event, userEmailSet)) continue;
      const payload = buildOutlookEventPayload(event);
      if (!payload) continue;

      desiredIds.add(event.id);
      const existing = existingMap.get(event.id);
      const targetLastEdited = event.lastEditedTime ? getEventLastEditedIso(event) : undefined;

      if (!existing) {
        await client.api(eventsBase).post(payload);
        updated++;
      } else if (targetLastEdited && existing.lastEdited !== targetLastEdited) {
        await client.api(`${eventsBase}/${encodeURIComponent(existing.graphId)}`).patch(payload);
        updated++;
      }
    }

    for (const [neiistId, existing] of existingMap.entries()) {
      if (!desiredIds.has(neiistId)) {
        await client.api(`${eventsBase}/${encodeURIComponent(existing.graphId)}`).delete();
        deleted++;
      }
    }

    return { updated, deleted };
  });
}
