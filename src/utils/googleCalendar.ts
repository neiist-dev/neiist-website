import { google } from "googleapis";
import { NotionEvent } from "@/types/notion";
import { getFirstAndLastName } from "@/utils/userUtils";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getServiceAccountCredentials() {
  const keyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;

  if (keyEnv.endsWith(".json")) {
    const keyPath = path.resolve(process.cwd(), keyEnv);
    const keyContent = fs.readFileSync(keyPath, "utf8");
    return JSON.parse(keyContent);
  }
  return JSON.parse(keyEnv);
}

function getCalendarClient() {
  const serviceAccountKey = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: SCOPES,
  });

  return google.calendar({ version: "v3", auth });
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

function buildGoogleCalendarDates(event: NotionEvent) {
  const dates = buildICalDatesFromNotion(event);
  if (!dates) return null;

  if (dates.allDay) {
    const startDate = dates.start.toISOString().split("T")[0];
    const endDate = dates.end.toISOString().split("T")[0];
    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  return {
    start: { dateTime: dates.start.toISOString(), timeZone: "UTC" },
    end: { dateTime: dates.end.toISOString(), timeZone: "UTC" },
  };
}

async function findCalendarByIstid(istid: string): Promise<string | null> {
  const calendar = getCalendarClient();

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
) {
  const calendar = getCalendarClient();
  const displayName = getFirstAndLastName(userName);

  const response = await calendar.calendars.insert({
    requestBody: {
      summary: `NEIIST-${displayName}`,
      description: `NEIIST Calendar for ${userName} (istid:${istid})`,
      timeZone: "Europe/Lisbon",
    },
  });

  const calendarId = response.data.id!;

  await calendar.acl.insert({
    calendarId,
    requestBody: {
      role: "reader",
      scope: {
        type: "user",
        value: userEmail,
      },
    },
    sendNotifications: false,
  });

  if (alternativeEmail && alternativeEmail !== userEmail) {
    try {
      await calendar.acl.insert({
        calendarId,
        requestBody: {
          role: "reader",
          scope: {
            type: "user",
            value: alternativeEmail,
          },
        },
        sendNotifications: false,
      });
    } catch (error) {
      console.error(`Failed to share calendar with alternative email ${alternativeEmail}:`, error);
      // Don't fail if alternative email sharing fails
    }
  }

  return calendarId;
}

export async function getOrCreateUserCalendar(
  userEmail: string,
  istid: string,
  userName: string,
  alternativeEmail?: string
) {
  const existingCalendarId = await findCalendarByIstid(istid);
  if (existingCalendarId) {
    const calendar = getCalendarClient();
    try {
      if (alternativeEmail && alternativeEmail !== userEmail) {
        const aclList = await calendar.acl.list({ calendarId: existingCalendarId });
        const hasAltEmailAccess = aclList.data.items?.some(
          (rule) => rule.scope?.type === "user" && rule.scope?.value === alternativeEmail
        );

        if (!hasAltEmailAccess) {
          await calendar.acl.insert({
            calendarId: existingCalendarId,
            requestBody: {
              role: "reader",
              scope: {
                type: "user",
                value: alternativeEmail,
              },
            },
            sendNotifications: false,
          });
        }
      }
    } catch (error) {
      console.error("Error updating calendar ACL:", error);
      // Don't fail if ACL update fails
    }

    return existingCalendarId;
  }

  return await createUserCalendar(userEmail, istid, userName, alternativeEmail);
}

export async function syncEventToCalendar(
  calendarId: string,
  event: NotionEvent,
  userEmail: string
) {
  const calendar = getCalendarClient();

  const shouldInclude =
    event.date &&
    (event.type !== "Meeting" || (event.type === "Meeting" && event.attendees.includes(userEmail)));

  if (!shouldInclude) {
    try {
      await deleteEventFromCalendar(calendarId, event.id);
    } catch {
      // Event doesn't exist, that's fine
    }
    return;
  }

  const dates = buildGoogleCalendarDates(event);
  if (!dates) return;

  const googleEventId = event.id.replace(/-/g, "").substring(0, 64);

  const googleEvent = {
    id: googleEventId,
    summary: event.title,
    description: [
      event.url,
      event.attendees.length ? `Attendees: ${event.attendees.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: event.location.length ? event.location.join(", ") : undefined,
    ...dates,
    source: {
      title: "Notion",
      url: event.url,
    },
  };

  try {
    await calendar.events.update({
      calendarId,
      eventId: googleEventId,
      requestBody: googleEvent,
    });
  } catch {
    try {
      await calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });
    } catch (insertError) {
      console.error("Error creating event:", insertError);
    }
  }
}

export async function deleteEventFromCalendar(calendarId: string, eventId: string) {
  const calendar = getCalendarClient();
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

export async function getAddCalendarLink(calendarId: string) {
  return `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(calendarId)}`;
}

export async function getCalendarWebLink(calendarId: string) {
  return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
}
