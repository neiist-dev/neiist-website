import { Activity, DbActivity, Ticket, CheckinResult, mapDbRowToActivity } from "@/types/events";

import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";

export const createActivitiesEvent = async (
  activity: Partial<Activity> & { id?: string }
): Promise<string> => {
  const { rows } = await db_query<{ create_activity: string }>(
    `SELECT neiist.create_activity($1::JSONB)`,
    [
      JSON.stringify({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        url: activity.url,
        location: activity.location,
        type: activity.type,
        teams: activity.teams,
        attendees: activity.attendees,
        start: activity.start,
        end: activity.end,
        all_day: activity.allDay,
        last_edited_time: activity.lastEditedTime,
        public: activity.public ?? true,
        source_type: "notion",
      }),
    ]
  );
  revalidateTag("activities", "max");
  return rows[0]?.create_activity ?? activity.id!;
};

export const updateActivitiesEvent = async (
  activity: Partial<Activity> & { id: string }
): Promise<void> => {
  await db_query(`SELECT neiist.update_activity($1, $2::JSONB)`, [
    activity.id,
    JSON.stringify({
      title: activity.title,
      description: activity.description,
      url: activity.url,
      location: activity.location,
      type: activity.type,
      teams: activity.teams,
      attendees: activity.attendees,
      start: activity.start,
      end: activity.end,
      all_day: activity.allDay,
      last_edited_time: activity.lastEditedTime,
      public: activity.public ?? true,
      source_type: "notion",
    }),
  ]);
  revalidateTag("activities", "max");
};

export const upsertWebsiteActivity = async (data: {
  id?: string;
  title: string;
  description: string;
  url?: string;
  location?: string[];
  type?: string;
  teams?: string[];
  attendees?: string[];
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  public?: boolean;
  signupEnabled?: boolean;
  signupDeadline?: string | Date | null;
  maxAttendees?: number | null;
  customIcon?: string | null;
  signupFields?: unknown;
  creatorIstid?: string | null;
}): Promise<string> => {
  const payload = JSON.stringify({
    title: data.title,
    description: data.description,
    url: data.url ?? null,
    location: data.location ?? [],
    type: data.type ?? "Outros",
    teams: data.teams ?? [],
    attendees: data.attendees ?? [],
    start: data.start ?? null,
    end: data.end ?? null,
    all_day: data.allDay ?? false,
    public: data.public ?? true,
    signup_enabled: data.signupEnabled ?? false,
    signup_deadline: data.signupDeadline ?? null,
    max_attendees: data.maxAttendees ?? null,
    custom_icon: data.customIcon ?? null,
    signup_fields: data.signupFields ?? null,
    created_by: data.creatorIstid ?? null,
    source_type: "website",
  });

  let activityId: string;
  if (data.id) {
    const { rows } = await db_query<{ update_activity: string }>(
      `SELECT neiist.update_activity($1, $2::JSONB)`,
      [data.id, payload]
    );
    activityId = rows[0]?.update_activity ?? data.id;
  } else {
    const { rows } = await db_query<{ create_activity: string }>(
      `SELECT neiist.create_activity($1::JSONB)`,
      [payload]
    );
    activityId = rows[0]?.create_activity;
  }

  revalidateTag("activities", "max");
  return activityId;
};

export const signUpToEvent = async (
  eventId: string,
  istid: string,
  orderNumber?: string,
  formResponses?: Record<string, unknown>,
  qrSignature?: string
): Promise<{ ticket_code: string; qr_signature: string }> => {
  const { rows } = await db_query<{ ticket_code: string; qr_signature: string }>(
    "SELECT * FROM neiist.sign_up_to_activity($1, $2, $3, $4, $5)",
    [
      eventId,
      istid,
      orderNumber ?? null,
      formResponses ? JSON.stringify(formResponses) : null,
      qrSignature ?? null,
    ]
  );
  revalidateTag("activities", "max");
  return rows[0];
};

export const removeSignUpFromEvent = async (eventId: string, istid: string): Promise<boolean> => {
  await db_query("SELECT neiist.remove_sign_up_from_activity($1, $2)", [eventId, istid]);
  revalidateTag("activities", "max");
  return true;
};

export const updateActivityProperties = async (
  properties: Partial<Activity> & { eventId: string }
): Promise<boolean> => {
  const payload: Record<string, unknown> = {
    source_type: "website",
  };
  if (properties.signupEnabled !== undefined) payload.signup_enabled = properties.signupEnabled;
  if (properties.signupDeadline !== undefined) payload.signup_deadline = properties.signupDeadline;
  if (properties.maxAttendees !== undefined) payload.max_attendees = properties.maxAttendees;
  if (properties.customIcon !== undefined) payload.custom_icon = properties.customIcon;
  if (properties.description !== undefined) payload.description = properties.description;
  if (properties.public !== undefined) payload.public = properties.public;
  if (properties.signupFields !== undefined) payload.signup_fields = properties.signupFields;

  await db_query("SELECT neiist.update_activity($1, $2::JSONB)", [
    properties.eventId,
    JSON.stringify(payload),
  ]);
  revalidateTag("activities", "max");
  return true;
};

export const getEventAttendanceRoster = async (eventId: string): Promise<Ticket[]> => {
  const { rows } = await db_query<Ticket>(
    `SELECT *, (order_number IS NOT NULL) AS is_paid FROM neiist.get_activity_roster($1)`,
    [eventId]
  );
  return rows;
};

export const getEventSubscribers = async (
  eventId: string
): Promise<Array<{ istid: string; name: string; email?: string; signed_up_at: Date }>> => {
  "use cache";
  cacheTag("activities");
  const roster = await getEventAttendanceRoster(eventId);
  return roster.map((r) => ({
    istid: r.istid,
    name: r.name,
    email: r.email,
    signed_up_at: r.signed_up_at,
  }));
};

export const getActivitiesEventsNoCache = async (
  publicOnly: boolean = false
): Promise<Activity[]> => {
  const { rows } = await db_query<DbActivity>(
    `SELECT * FROM neiist.get_activities(NULL::TEXT, $1::BOOLEAN)`,
    [publicOnly]
  );
  return rows.map(mapDbRowToActivity);
};

export const getActivitiesEvents = async (publicOnly: boolean = false): Promise<Activity[]> => {
  "use cache";
  cacheTag("activities");
  return getActivitiesEventsNoCache(publicOnly);
};

export const getActivityByIdNoCache = async (eventId: string): Promise<Activity | null> => {
  const { rows } = await db_query<DbActivity>(
    `SELECT * FROM neiist.get_activities($1::TEXT, FALSE::BOOLEAN)`,
    [eventId]
  );
  if (!rows[0]) return null;
  return mapDbRowToActivity(rows[0]);
};

export const getActivityById = async (eventId: string): Promise<Activity | null> => {
  "use cache";
  cacheTag("activities", `activity-${eventId}`);
  return getActivityByIdNoCache(eventId);
};

export const deleteActivitiesEvent = async (id: string): Promise<void> => {
  await db_query(`SELECT neiist.delete_activity($1)`, [id]);
  revalidateTag("activities", "max");
};

export const markEventAttendance = async (
  eventId: string,
  ticketCodeOrIstid: string,
  staffIstid: string
): Promise<CheckinResult> => {
  const { rows } = await db_query<{
    ticket_input: string;
    success: boolean;
    already_checked_in: boolean;
    error: string | null;
    attendee_name: string;
    attendee_istid: string;
    ticket_code: string;
    order_number: string | null;
    form_responses: Record<string, unknown> | null;
    checked_in_at: Date;
    checked_in_by: string;
    checked_in_by_name: string;
  }>(`SELECT * FROM neiist.check_in_activity($1, ARRAY[$2]::TEXT[], TRUE, $3)`, [
    eventId,
    ticketCodeOrIstid.trim(),
    staffIstid,
  ]);
  const row = rows[0];
  if (!row || row.error || (!row.success && !row.already_checked_in)) {
    throw new Error(row?.error || "Failed to mark attendance");
  }
  revalidateTag("activities", "max");
  return {
    success: row.success,
    already_checked_in: row.already_checked_in,
    attendee_name: row.attendee_name,
    attendee_istid: row.attendee_istid,
    ticket_code: row.ticket_code,
    order_number: row.order_number,
    form_responses: row.form_responses,
    checked_in_at: row.checked_in_at,
    checked_in_by: row.checked_in_by,
    checked_in_by_name: row.checked_in_by_name,
    activity_id: eventId,
    user_ist_id: row.attendee_istid,
    attended: row.success || row.already_checked_in,
  };
};

export const markEventAttendanceBatch = async (
  eventId: string,
  ticketCodesOrIstids: string[],
  staffIstid: string
): Promise<
  Array<{
    ticketCodeOrIstid: string;
    success: boolean;
    alreadyCheckedIn: boolean;
    error?: string;
  }>
> => {
  if (ticketCodesOrIstids.length === 0) return [];
  const trimmed = ticketCodesOrIstids.map((c) => c.trim()).filter(Boolean);
  const { rows } = await db_query<{
    ticket_input: string;
    success: boolean;
    already_checked_in: boolean;
    error: string | null;
  }>(
    `SELECT ticket_input, success, already_checked_in, error FROM neiist.check_in_activity($1, $2::TEXT[], TRUE, $3)`,
    [eventId, trimmed, staffIstid]
  );
  revalidateTag("activities", "max");
  return rows.map((r) => ({
    ticketCodeOrIstid: r.ticket_input,
    success: r.success,
    alreadyCheckedIn: r.already_checked_in,
    error: r.error ?? undefined,
  }));
};

export const unmarkEventAttendance = async (
  eventId: string,
  ticketCodeOrIstid: string
): Promise<boolean> => {
  const { rows } = await db_query<{ success: boolean }>(
    `SELECT * FROM neiist.check_in_activity($1, ARRAY[$2]::TEXT[], FALSE, NULL)`,
    [eventId, ticketCodeOrIstid.trim()]
  );
  revalidateTag("activities", "max");
  return Boolean(rows[0]?.success);
};

export const getUserTickets = async (istid: string): Promise<Ticket[]> => {
  const { rows } = await db_query<Ticket>(
    `SELECT *, attendee_istid AS istid, attendee_name AS name FROM neiist.get_activity_tickets(NULL, $1, NULL)`,
    [istid]
  );
  return rows;
};

export const getUserEventTicket = async (
  eventId: string,
  istid: string
): Promise<Ticket | null> => {
  const { rows } = await db_query<Ticket>(
    `SELECT *, attendee_istid AS istid, attendee_name AS name FROM neiist.get_activity_tickets($1, $2, NULL)`,
    [eventId, istid]
  );
  return rows[0] ?? null;
};

export const getEventTicketByCode = async (ticketCode: string): Promise<Ticket | null> => {
  const { rows } = await db_query<Ticket>(
    `SELECT *, attendee_istid AS istid, attendee_name AS name FROM neiist.get_activity_tickets(NULL, NULL, $1)`,
    [ticketCode.trim()]
  );
  return rows[0] ?? null;
};
