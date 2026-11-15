import { google } from "googleapis";
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
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;

let _calendarClient: ReturnType<typeof google.calendar> | null = null;

export function getCalendarClient(): ReturnType<typeof google.calendar> | null {
  if (!_calendarClient) {
    const serviceAccountKey = getServiceAccount("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) return null;
    const auth = new google.auth.GoogleAuth({ credentials: serviceAccountKey, scopes: SCOPES });
    _calendarClient = google.calendar({ version: "v3", auth });
  }
  return _calendarClient;
}

function buildGoogleCalendarDates(event: Activity) {
  if (!event.start || !event.end) return null;

  if (event.allDay) {
    const startDate = event.start.toISOString().split("T")[0];
    const endDate = event.end.toISOString().split("T")[0];
    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  return {
    start: { dateTime: event.start.toISOString(), timeZone: "UTC" },
    end: { dateTime: event.end.toISOString(), timeZone: "UTC" },
  };
}

async function findCalendarByIstid(istid: string): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  try {
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    const found = calendars.find(
      (cal) => cal.summary?.startsWith(`NEIIST-`) && cal.description?.includes(`istid:${istid}`)
    );

    return found?.id || null;
  } catch (error) {
    console.error("Error finding calendar:", error);
    return null;
  }
}

async function ensureWriterAcl(
  calendar: NonNullable<ReturnType<typeof getCalendarClient>>,
  calendarId: string,
  email: string,
  existingRules?: Array<{
    id?: string | null;
    role?: string | null;
    scope?: { type?: string | null; value?: string | null } | null;
  }>
) {
  try {
    const normalized = email.trim().toLowerCase();
    const userRule = existingRules?.find(
      (rule) =>
        rule.scope?.type === "user" && rule.scope?.value?.trim().toLowerCase() === normalized
    );

    if (userRule && userRule.role !== "writer") {
      await calendar.acl.update({
        calendarId,
        ruleId: userRule.id!,
        requestBody: {
          role: "writer",
          scope: {
            type: "user",
            value: email,
          },
        },
      });
    } else if (!userRule) {
      await calendar.acl.insert({
        calendarId,
        requestBody: {
          role: "writer",
          scope: {
            type: "user",
            value: email,
          },
        },
        sendNotifications: true,
      });
    }
  } catch (error) {
    console.error(`Failed to share calendar with ${email}:`, error);
  }
}

export async function createUserCalendar(
  userEmail: string,
  istid: string,
  userName: string,
  alternativeEmail?: string
): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;
  const displayName = getFirstAndLastName(userName);

  const response = await calendar.calendars.insert({
    requestBody: {
      summary: `NEIIST-${displayName}`,
      description: `NEIIST Calendar for ${userName} (istid:${istid})`,
      timeZone: "Europe/Lisbon",
    },
  });

  const calendarId = response.data.id!;

  const emailsToShare = Array.from(
    new Set([userEmail, alternativeEmail].filter((e): e is string => Boolean(e)))
  );
  for (const email of emailsToShare) {
    await ensureWriterAcl(calendar, calendarId, email);
  }

  return calendarId;
}

export async function getOrCreateUserCalendar(
  userEmail: string,
  istid: string,
  userName: string,
  alternativeEmail?: string
): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const existingCalendarId = await findCalendarByIstid(istid);
  if (existingCalendarId) {
    try {
      const aclList = await calendar.acl.list({ calendarId: existingCalendarId });
      const existingRules = aclList.data.items ?? [];

      const defaultRule = existingRules.find((rule) => rule.scope?.type === "default");
      if (defaultRule?.id) {
        await calendar.acl
          .delete({ calendarId: existingCalendarId, ruleId: defaultRule.id })
          .catch(() => {});
      }

      const emailsToShare = Array.from(
        new Set([userEmail, alternativeEmail].filter((e): e is string => Boolean(e)))
      );
      for (const email of emailsToShare) {
        await ensureWriterAcl(calendar, existingCalendarId, email, existingRules);
      }
    } catch (error) {
      console.error("Error updating calendar ACL:", error);
    }

    return existingCalendarId;
  }

  return await createUserCalendar(userEmail, istid, userName, alternativeEmail);
}

async function getExistingCalendarEvents(calendarId: string): Promise<Map<string, string>> {
  const calendar = getCalendarClient();
  const eventMap = new Map<string, string>();
  if (!calendar) return eventMap;

  try {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      singleEvents: true,
      showDeleted: false,
    });

    const events = response.data.items || [];

    for (const event of events) {
      if (event.id) {
        const lastEdited =
          event.extendedProperties?.private?.notionLastEdited ||
          event.extendedProperties?.private?.lastEdited ||
          event.updated ||
          "";
        eventMap.set(event.id, lastEdited);
      }
    }
  } catch (error) {
    console.error("Error fetching existing events:", error);
  }

  return eventMap;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncEventToCalendar(
  calendarId: string,
  event: Activity,
  userEmail: string,
  existingEventIds?: Set<string>,
  alternativeEmail?: string,
  neiistEmail?: string
) {
  const calendar = getCalendarClient();
  if (!calendar) return;

  const userEmailSet = normalizeUserEmails([userEmail, alternativeEmail, neiistEmail]);
  const shouldInclude = shouldIncludeCalendarEvent(event, userEmailSet);

  const googleEventId = event.id.replace(/-/g, "").substring(0, 64);

  if (!shouldInclude) {
    if (existingEventIds?.has(googleEventId)) {
      try {
        await deleteEventFromCalendar(calendarId, event.id);
      } catch {
        // Event doesn't exist, that's fine
      }
    }
    return;
  }

  const dates = buildGoogleCalendarDates(event);
  if (!dates) return;

  const validUrl = getValidEventUrl(event);
  const lastEditedIso = getEventLastEditedIso(event);

  const googleEvent = {
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
      ? {
          source: {
            title: event.sourceType === "notion" ? "Notion" : "NEIIST",
            url: validUrl,
          },
        }
      : {}),
    extendedProperties: {
      private: {
        notionLastEdited: lastEditedIso,
        lastEdited: lastEditedIso,
      },
    },
  };

  if (existingEventIds?.has(googleEventId)) {
    try {
      await calendar.events.update({
        calendarId,
        eventId: googleEventId,
        requestBody: googleEvent,
      });
    } catch (error: unknown) {
      const err = error as { status?: number; code?: number };
      if (err?.status === 404 || err?.code === 404) {
        try {
          await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });
        } catch (insertErr) {
          console.error(`Error inserting event after 404 ${googleEventId}:`, insertErr);
        }
      } else {
        console.error(`Error updating event ${googleEventId}:`, error);
      }
    }
  } else {
    try {
      await calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });
    } catch (error: unknown) {
      const err = error as { status?: number; code?: number };
      if (err?.status === 409 || err?.code === 409) {
        try {
          await calendar.events.update({
            calendarId,
            eventId: googleEventId,
            requestBody: googleEvent,
          });
        } catch (updateErr) {
          console.error(`Error updating event after 409 ${googleEventId}:`, updateErr);
        }
      } else {
        console.error(`Error inserting event ${googleEventId}:`, error);
      }
    }
  }
}

export async function syncAllEventsToCalendar(
  calendarId: string,
  events: Activity[],
  userEmail: string,
  alternativeEmail?: string,
  neiistEmail?: string
) {
  const existingEvents = await getExistingCalendarEvents(calendarId);

  const eventsToUpdate: Activity[] = [];
  const eventsToDelete: string[] = [];
  const existingEventIds = new Set(existingEvents.keys());

  const userEmailSet = normalizeUserEmails([userEmail, alternativeEmail, neiistEmail]);

  for (const event of events) {
    const shouldInclude = shouldIncludeCalendarEvent(event, userEmailSet);

    const googleEventId = event.id.replace(/-/g, "").substring(0, 64);

    if (!shouldInclude) {
      if (existingEventIds.has(googleEventId)) {
        eventsToDelete.push(googleEventId);
      }
      continue;
    }

    const existingLastEdited = existingEvents.get(googleEventId);

    if (
      !existingLastEdited ||
      (event.lastEditedTime &&
        new Date(event.lastEditedTime).getTime() > new Date(existingLastEdited).getTime())
    ) {
      eventsToUpdate.push(event);
    }

    existingEventIds.delete(googleEventId);
  }

  for (const eventId of existingEventIds) {
    eventsToDelete.push(eventId);
  }

  const existingIdSet = new Set(existingEvents.keys());

  for (let i = 0; i < eventsToUpdate.length; i += BATCH_SIZE) {
    const batch = eventsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((event) =>
        syncEventToCalendar(
          calendarId,
          event,
          userEmail,
          existingIdSet,
          alternativeEmail,
          neiistEmail
        )
      )
    );
    if (i + BATCH_SIZE < eventsToUpdate.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  for (let i = 0; i < eventsToDelete.length; i += BATCH_SIZE) {
    const batch = eventsToDelete.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((eventId) => deleteEventFromCalendar(calendarId, eventId)));
    if (i + BATCH_SIZE < eventsToDelete.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return {
    updated: eventsToUpdate.length,
    deleted: eventsToDelete.length,
    unchanged: events.length - eventsToUpdate.length - eventsToDelete.length,
  };
}

export async function deleteEventFromCalendar(calendarId: string, eventId: string) {
  const calendar = getCalendarClient();
  if (!calendar) return;

  const googleEventId = eventId.replace(/-/g, "").substring(0, 64);

  try {
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
  } catch {
    // Event doesn't exist or already deleted
  }
}

export async function getAddCalendarLink(calendarId: string | null | undefined) {
  if (!calendarId) return "";
  return `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}&mode=WEEK`;
}
