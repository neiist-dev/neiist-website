import { google } from "googleapis";
import type { Activity } from "@/types/events";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getServiceAccount } from "@/lib/google/serviceAccount";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 10;

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

  // Make calendar public with reader access
  await calendar.acl.insert({
    calendarId,
    requestBody: {
      role: "reader",
      scope: { type: "default" },
    },
    sendNotifications: false,
  });

  // Share with user email as editor
  await calendar.acl.insert({
    calendarId,
    requestBody: {
      role: "writer",
      scope: {
        type: "user",
        value: userEmail,
      },
    },
    sendNotifications: true,
  });

  if (alternativeEmail && alternativeEmail !== userEmail) {
    try {
      await calendar.acl.insert({
        calendarId,
        requestBody: {
          role: "writer",
          scope: {
            type: "user",
            value: alternativeEmail,
          },
        },
        sendNotifications: true,
      });
    } catch (error) {
      console.error(`Failed to share calendar with alternative email ${alternativeEmail}:`, error);
    }
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
      // Ensure calendar is public
      try {
        await calendar.acl.update({
          calendarId: existingCalendarId,
          ruleId: "default",
          requestBody: {
            role: "reader",
            scope: { type: "default" },
          },
        });
      } catch (error) {
        const err = error as { code?: number };
        if (err?.code === 404) {
          await calendar.acl.insert({
            calendarId: existingCalendarId,
            requestBody: {
              role: "reader",
              scope: { type: "default" },
            },
            sendNotifications: false,
          });
        }
      }

      // Update user email to writer if needed
      const aclList = await calendar.acl.list({ calendarId: existingCalendarId });
      const userRule = aclList.data.items?.find(
        (rule) => rule.scope?.type === "user" && rule.scope?.value === userEmail
      );

      if (userRule && userRule.role !== "writer") {
        await calendar.acl.update({
          calendarId: existingCalendarId,
          ruleId: userRule.id!,
          requestBody: {
            role: "writer",
            scope: {
              type: "user",
              value: userEmail,
            },
          },
        });
      } else if (!userRule) {
        await calendar.acl.insert({
          calendarId: existingCalendarId,
          requestBody: {
            role: "writer",
            scope: {
              type: "user",
              value: userEmail,
            },
          },
          sendNotifications: true,
        });
      }

      if (alternativeEmail && alternativeEmail !== userEmail) {
        const hasAltEmailAccess = aclList.data.items?.some(
          (rule) => rule.scope?.type === "user" && rule.scope?.value === alternativeEmail
        );

        if (!hasAltEmailAccess) {
          await calendar.acl.insert({
            calendarId: existingCalendarId,
            requestBody: {
              role: "writer",
              scope: {
                type: "user",
                value: alternativeEmail,
              },
            },
            sendNotifications: true,
          });
        } else {
          const altRule = aclList.data.items?.find(
            (rule) => rule.scope?.type === "user" && rule.scope?.value === alternativeEmail
          );
          if (altRule && altRule.role !== "writer") {
            await calendar.acl.update({
              calendarId: existingCalendarId,
              ruleId: altRule.id!,
              requestBody: {
                role: "writer",
                scope: {
                  type: "user",
                  value: alternativeEmail,
                },
              },
            });
          }
        }
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
  alternativeEmail?: string
) {
  const calendar = getCalendarClient();
  if (!calendar) return;

  const userEmails = [userEmail, ...(alternativeEmail ? [alternativeEmail] : [])];
  const shouldInclude =
    event.start &&
    (event.type !== "Meeting" ||
      (event.type === "Meeting" && event.attendees.some((email) => userEmails.includes(email))));

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

  const validUrl = event.url && event.url.startsWith("http") ? event.url : undefined;
  const lastEditedIso = event.lastEditedTime
    ? event.lastEditedTime.toISOString()
    : new Date().toISOString();

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

export async function syncEventsToCalendarBatched(
  calendarId: string,
  events: Activity[],
  userEmail: string,
  alternativeEmail?: string
) {
  const existingEvents = await getExistingCalendarEvents(calendarId);
  const existingEventIds = new Set(existingEvents.keys());

  let synced = 0;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((event) =>
        syncEventToCalendar(calendarId, event, userEmail, existingEventIds, alternativeEmail)
      )
    );
    synced += batch.length;
    if (i + BATCH_SIZE < events.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
  return synced;
}

export async function syncAllEventsToCalendar(
  calendarId: string,
  events: Activity[],
  userEmail: string,
  alternativeEmail?: string
) {
  const existingEvents = await getExistingCalendarEvents(calendarId);

  const eventsToUpdate: Activity[] = [];
  const eventsToDelete: string[] = [];
  const existingEventIds = new Set(existingEvents.keys());

  const userEmails = [userEmail, ...(alternativeEmail ? [alternativeEmail] : [])];

  for (const event of events) {
    const shouldInclude =
      event.start &&
      (event.type !== "Meeting" ||
        (event.type === "Meeting" && event.attendees.some((email) => userEmails.includes(email))));

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

  for (let i = 0; i < eventsToUpdate.length; i += BATCH_SIZE) {
    const batch = eventsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((event) =>
        syncEventToCalendar(
          calendarId,
          event,
          userEmail,
          new Set(existingEvents.keys()),
          alternativeEmail
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

export async function getCalendarWebLink(calendarId: string | null | undefined) {
  if (!calendarId) return "";
  return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
}
