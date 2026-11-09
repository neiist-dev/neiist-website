import type { StaticImageData } from "next/image";

export const EVENT_TYPES = ["Meeting", "Event"] as const;

export interface Event {
  id: string;
  title: string;
  description: string;
  image: string | StaticImageData;
}

export interface SignupField {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DbActivity {
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
  public: boolean;
  source_type: string;
  signup_fields?: SignupField[] | string | null;
  event_ticket_product_id?: number | null;
  event_ticket_price?: string | number | null;
  subscribers: string[];
  subscriber_count: string | number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string[];
  type: string;
  teams: string[];
  attendees: string[];
  public: boolean;

  signupEnabled: boolean;
  signupDeadline: Date | null;
  maxAttendees: number | null;
  customIcon: string | null;
  ticketProductId?: number | null;
  ticketPrice?: number | null;
  signupFields?: SignupField[] | null;

  subscribers: string[];
  subscriberCount: number;
  url?: string;
  lastEditedTime?: Date;
  sourceType?: string;
}

export interface Ticket {
  ticket_code: string;
  qr_signature: string;
  order_number: string | null;
  is_paid: boolean;
  form_responses: Record<string, unknown> | null;
  checked_in_at: Date | null;
  checked_in_by: string | null;
  checked_in_by_name: string | null;
  signed_up_at: Date;

  istid: string;
  name: string;
  email?: string;
  attendee_istid?: string;
  attendee_name?: string;

  event_id?: string;
  event_title?: string;
  event_description?: string;
  event_location?: string[];
  event_start?: Date;
  event_end?: Date;
  event_all_day?: boolean;
  event_custom_icon?: string | null;
}

export interface CheckinResult {
  success: boolean;
  already_checked_in: boolean;
  attendee_name: string;
  attendee_istid: string;
  ticket_code: string;
  order_number: string | null;
  form_responses: Record<string, unknown> | null;
  checked_in_at: Date;
  checked_in_by: string;
  checked_in_by_name: string;
  activity_id?: string;
  user_ist_id?: string;
  attended?: boolean;
}

export function mapDbRowToActivity(row: DbActivity): Activity {
  const parsedFields = Array.isArray(row.signup_fields)
    ? row.signup_fields
    : typeof row.signup_fields === "string"
      ? (JSON.parse(row.signup_fields) as SignupField[])
      : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    url: row.url || "",
    location: row.location || [],
    type: row.type || "",
    teams: row.teams || [],
    attendees: row.attendees || [],
    start: new Date(row.start),
    end: new Date(row.end),
    allDay: Boolean(row.all_day),
    public: row.public,
    signupEnabled: Boolean(row.signup_enabled),
    signupDeadline: row.signup_deadline ? new Date(row.signup_deadline) : null,
    maxAttendees: row.max_attendees ?? null,
    customIcon: row.custom_icon ?? null,
    ticketProductId: row.event_ticket_product_id ?? null,
    ticketPrice: row.event_ticket_price != null ? Number(row.event_ticket_price) : null,
    signupFields: parsedFields,
    subscribers: row.subscribers || [],
    subscriberCount: parseInt(String(row.subscriber_count), 10) || 0,
    lastEditedTime: row.last_edited_time ? new Date(row.last_edited_time) : undefined,
    sourceType: row.source_type,
  };
}
