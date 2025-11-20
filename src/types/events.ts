import type { StaticImageData } from "next/image";

export interface Event {
  id: string;
  title: string;
  description: string;
  image: string | StaticImageData;
}

export interface NotionEvent {
  id: string;
  title: string;
  date: string | null;
  end: string | null;
  url: string;
  location: string[];
  type: string | null;
  teams: string[];
  attendees: string[];
  lastEditedTime: string;
  public: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  extendedProperties?: {
    private?: EventExtendedProperties;
  };
  source?: {
    title: string;
    url: string;
  };
  subscribers?: string[];
  subscriberCount?: number;
}

export interface EventExtendedProperties {
  type?: string;
  teams?: string;
  attendees?: string;
  lastEditedTime?: string;
  signupEnabled?: boolean;
  signupDeadline?: string;
  maxAttendees?: number;
  customIcon?: string;
  customDescription?: string;
}

export interface EventSettings {
  signupEnabled: boolean;
  signupDeadline: string;
  maxAttendees: string;
  customIcon: string;
  description: string;
}

export interface NormalizedCalendarEvent {
  id: string;
  summary: string;
  location?: string;
  isAllDay: boolean;
  start: Date;
  end: Date;
  raw: CalendarEvent;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: NormalizedCalendarEvent[];
}

export interface PositionedEvent {
  event: NormalizedCalendarEvent;
  startCol: number;
  span: number;
  row: number;
  weekIndex: number;
}

export type CalendarMode = "month" | "week" | "3days";

export interface DbActivityRow {
  id: string;
  title: string;
  description: string;
  url: string;
  location: string[];
  type: string;
  teams: string[];
  attendees: string[];
  start: Date;
  end: Date;
  all_day: boolean;
  last_edited_time: Date;
  signup_enabled: boolean;
  signup_deadline: Date | null;
  max_attendees: number | null;
  custom_icon: string | null;
  subscribers: string[];
  subscriber_count: string;
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  url: string;
  location: string[];
  type: string;
  teams: string[];
  attendees: string[];
  start: Date;
  end: Date;
  allDay: boolean;
  lastEditedTime: Date;
}

export interface ActivityProperties {
  eventId: string;
  signupEnabled: boolean;
  signupDeadline: Date | null;
  maxAttendees: number | null;
  customIcon: string | null;
  description?: string | null;
}

export interface ActivitySignUp {
  event_id: string;
  user_istid: string;
  signed_up_at: Date;
}

export interface EventSubscriber {
  istid: string;
  name: string;
  email: string;
  signed_up_at: Date;
}

export function getEventSettings(event: CalendarEvent): EventSettings {
  const props = event.extendedProperties?.private || {};
  return {
    signupEnabled: props.signupEnabled ?? false,
    signupDeadline: props.signupDeadline
      ? new Date(props.signupDeadline).toISOString().slice(0, 16)
      : "",
    maxAttendees: props.maxAttendees?.toString() ?? "",
    customIcon: props.customIcon ?? "FaCalendar",
    description: event.description || props.customDescription || "",
  };
}

export function mapDbRowToCalendarEvent(row: DbActivityRow): CalendarEvent {
  return {
    id: row.id,
    summary: row.title,
    description: row.description,
    location: row.location?.join(", "),
    start: row.all_day
      ? { date: row.start.toISOString().split("T")[0] }
      : { dateTime: row.start.toISOString(), timeZone: "UTC" },
    end: row.all_day
      ? { date: row.end.toISOString().split("T")[0] }
      : { dateTime: row.end.toISOString(), timeZone: "UTC" },
    extendedProperties: {
      private: {
        type: row.type,
        teams: row.teams?.join(","),
        attendees: row.attendees?.join(","),
        lastEditedTime: row.last_edited_time?.toISOString(),
        signupEnabled: row.signup_enabled,
        signupDeadline: row.signup_deadline?.toISOString(),
        maxAttendees: row.max_attendees ?? undefined,
        customIcon: row.custom_icon ?? undefined,
      },
    },
    subscribers: row.subscribers || [],
    subscriberCount: parseInt(row.subscriber_count) || 0,
  };
}

export function mapNotionEventToCalendarEvent(notionEvent: NotionEvent): CalendarEvent {
  const isDateOnly = (s?: string | null) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

  const startIsDateOnly = isDateOnly(notionEvent.date);

  return {
    id: notionEvent.id,
    summary: notionEvent.title,
    description: notionEvent.url,
    location: notionEvent.location.join(", "),
    start: startIsDateOnly
      ? { date: notionEvent.date! }
      : { dateTime: notionEvent.date!, timeZone: "UTC" },
    end: notionEvent.end
      ? startIsDateOnly
        ? { date: notionEvent.end }
        : { dateTime: notionEvent.end, timeZone: "UTC" }
      : startIsDateOnly
        ? { date: notionEvent.date! }
        : { dateTime: notionEvent.date!, timeZone: "UTC" },
    source: {
      title: "Notion",
      url: notionEvent.url,
    },
    extendedProperties: {
      private: {
        type: notionEvent.type ?? undefined,
        teams: notionEvent.teams.join(","),
        attendees: notionEvent.attendees.join(","),
        lastEditedTime: notionEvent.lastEditedTime,
      },
    },
  };
}
