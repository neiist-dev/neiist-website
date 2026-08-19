import {
  ActivityEvent,
  ActivityProperties,
  CalendarEvent,
  DbActivityRow,
  EventSubscriber,
  mapDbRowToCalendarEvent,
} from "@/types/events";

import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";

export const updateActivitiesEvent = async (
  activity: Partial<ActivityEvent> & { id: string }
): Promise<void> => {
  try {
    await db_query(`SELECT neiist.update_activities($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [
      activity.id,
      activity.title,
      activity.description,
      activity.url,
      activity.location,
      activity.type,
      activity.teams,
      activity.attendees,
      activity.start,
      activity.end,
      activity.allDay,
      activity.lastEditedTime,
    ]);
    revalidateTag("activities", "max");
  } catch (error) {
    console.error("[EventRepository] Error updating activities event:", error);
  }
};

export const signUpToEvent = async (eventId: string, istid: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.sign_up_to_event($1, $2)", [eventId, istid]);
    revalidateTag("activities", "max");
    return true;
  } catch (error) {
    console.error("[EventRepository] Error signing up to event:", error);
    return false;
  }
};

export const removeSignUpFromEvent = async (eventId: string, istid: string): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.remove_sign_up_from_event($1, $2)", [eventId, istid]);
    revalidateTag("activities", "max");
    return true;
  } catch (error) {
    console.error("[EventRepository] Error removing sign up from event:", error);
    return false;
  }
};

export const updateActivityProperties = async (
  properties: Partial<ActivityProperties> & { eventId: string }
): Promise<boolean> => {
  try {
    await db_query("SELECT neiist.update_activity_properties($1, $2, $3, $4, $5, $6)", [
      properties.eventId,
      properties.signupEnabled ?? false,
      properties.signupDeadline,
      properties.maxAttendees,
      properties.customIcon,
      properties.description ?? null,
    ]);
    revalidateTag("activities", "max");
    return true;
  } catch (error) {
    console.error("[EventRepository] Error updating activity properties:", error);
    return false;
  }
};

export const getEventSubscribers = async (eventId: string): Promise<EventSubscriber[]> => {
  "use cache";
  cacheTag("activities");
  try {
    const { rows } = await db_query<EventSubscriber>(
      "SELECT * FROM neiist.get_event_subscribers($1)",
      [eventId]
    );
    return rows;
  } catch (error) {
    console.error("[EventRepository] Error getting event subscribers:", error);
    return [];
  }
};

export const getActivitiesEventsFromDb = async (): Promise<CalendarEvent[]> => {
  "use cache";
  cacheTag("activities");
  try {
    const { rows } = await db_query<DbActivityRow>(`SELECT * FROM neiist.get_all_activities()`);
    return rows.map(mapDbRowToCalendarEvent);
  } catch (error) {
    console.error("[EventRepository] Error getting activities events:", error);
    return [];
  }
};

export const deleteActivitiesEvent = async (id: string): Promise<void> => {
  try {
    await db_query(`SELECT neiist.delete_activities($1)`, [id]);
    revalidateTag("activities", "max");
  } catch (error) {
    console.error("[EventRepository] Error deleting activities event:", error);
  }
};
