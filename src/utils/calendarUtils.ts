import type { Activity } from "@/types/events";
import type { User } from "@/types/user";

export const truncateToDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return truncateToDay(c);
};

export const datesMatch = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}h${String(date.getMinutes()).padStart(2, "0")}`;

export const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

export function formatEventDateTime(event: Activity): {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
} {
  if (!event?.start && !event?.end)
    return { startDate: "TBD", endDate: "TBD", startTime: "TBD", endTime: "TBD", isAllDay: false };

  const start = new Date(event.start);
  const end = new Date(event.end);
  const startTime = `${String(start.getHours()).padStart(2, "0")}h${String(start.getMinutes()).padStart(2, "0")}`;
  const endTime = `${String(end.getHours()).padStart(2, "0")}h${String(end.getMinutes()).padStart(2, "0")}`;

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    startTime,
    endTime,
    isAllDay: Boolean(event.allDay),
  };
}

export function getUserCalendarEmails(
  user: Pick<User, "email" | "alternativeEmail" | "alternativeEmailVerified" | "neiistEmail">
): string[] {
  const altEmail = user.alternativeEmailVerified ? user.alternativeEmail : undefined;
  return [user.email, altEmail, user.neiistEmail].filter((e): e is string => Boolean(e?.trim()));
}

export function normalizeUserEmails(emails: Array<string | null | undefined>): Set<string> {
  return new Set(
    emails
      .filter((email): email is string => Boolean(email?.trim()))
      .map((email) => email.trim().toLowerCase())
  );
}

export function shouldIncludeCalendarEvent(event: Activity, userEmailSet: Set<string>): boolean {
  if (!event.start) return false;
  if (event.type !== "Meeting") return true;
  return event.attendees.some((email) => userEmailSet.has(email.trim().toLowerCase()));
}

export function getValidEventUrl(event: Activity): string | undefined {
  return event.url && event.url.startsWith("http") ? event.url : undefined;
}

export function getEventLastEditedIso(event: Activity): string {
  return event.lastEditedTime ? event.lastEditedTime.toISOString() : new Date().toISOString();
}
