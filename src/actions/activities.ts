"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission, requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import {
  getEventAttendanceRoster,
  getActivityById,
  upsertWebsiteActivity,
  updateActivityProperties,
  deleteActivitiesEvent,
} from "@/lib/db/repositories/event.repository";
import {
  triggerDebouncedCalendarSync,
  scheduleEventReminder,
  cancelEventReminder,
} from "@/lib/redis/queue";
import { sendEmail } from "@/lib/email";
import { interpolateEmailVariables, renderEmailMarkdownToHtml } from "@/lib/email/baseEmail";
import type { Ticket, SignupField } from "@/types/events";

export async function sendEventParticipantsEmailAction(payload: {
  eventId: string;
  subject: string;
  body: string;
  recipientIstids?: string[];
}): Promise<{ success: boolean; sentCount: number }> {
  await requirePermission("events:write");

  const [event, roster] = await Promise.all([
    getActivityById(payload.eventId),
    getEventAttendanceRoster(payload.eventId),
  ]);

  if (!event) throw new Error("Evento não encontrado");

  const targetIstids = payload.recipientIstids ? new Set(payload.recipientIstids) : null;

  const targetAttendees = targetIstids
    ? roster.filter((item: Ticket) => targetIstids.has(item.istid))
    : roster;

  let sentCount = 0;

  for (const attendee of targetAttendees) {
    if (!attendee.email) continue;

    const vars: Record<string, string> = {
      name: attendee.name,
      istid: attendee.istid,
      ticket_code: attendee.ticket_code,
      event_title: event.title,
      email: attendee.email,
    };

    const subject = interpolateEmailVariables(payload.subject, vars);
    const html = renderEmailMarkdownToHtml(payload.body, vars);

    const sent = await sendEmail({
      to: attendee.email,
      subject,
      html,
    });

    if (sent) sentCount++;
  }

  return { success: true, sentCount };
}

export async function saveActivityAction(payload: {
  eventId?: string;
  title?: string;
  signupEnabled?: boolean;
  signupDeadline?: string | null;
  maxAttendees?: number | string | null;
  customIcon?: string | null;
  description?: string | null;
  public?: boolean;
  signupFields?: unknown;
  location?: string | string[];
  type?: string;
  start?: string | null;
  end?: string | null;
  allDay?: boolean;
  url?: string | null;
}): Promise<{ success: boolean; id?: string }> {
  const session = await requirePermission("events:write");

  const {
    eventId,
    title,
    signupEnabled,
    signupDeadline,
    maxAttendees,
    customIcon,
    description,
    public: isPublic,
    signupFields,
    location,
    type,
    start,
    end,
    allDay,
    url,
  } = payload;

  if (title || !eventId) {
    if (!title) throw new Error("O título do evento é obrigatório");

    const upsertedId = await upsertWebsiteActivity({
      id: eventId || undefined,
      title,
      description: description ?? "",
      url: url ?? undefined,
      location: Array.isArray(location) ? location : location ? [location] : [],
      type: type ?? "Event",
      start: start ? new Date(start) : new Date(),
      end: end ? new Date(end) : undefined,
      allDay: Boolean(allDay),
      public: isPublic !== false,
      signupEnabled: Boolean(signupEnabled),
      signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
      maxAttendees:
        maxAttendees !== undefined && maxAttendees !== null && maxAttendees !== ""
          ? Number(maxAttendees)
          : null,
      customIcon: customIcon || null,
      signupFields: (signupFields as SignupField[] | null) ?? null,
      creatorIstid: session.user.istid,
    });

    revalidateTag("activities", "max");
    revalidatePath("/activities");
    revalidatePath("/activities/manage");
    revalidatePath("/[locale]/activities/manage", "page");
    await triggerDebouncedCalendarSync("website_mutation", 3000);

    if (start) {
      await scheduleEventReminder({
        id: upsertedId,
        start: { dateTime: new Date(start).toISOString() },
      });
    }

    return { success: true, id: upsertedId };
  }

  const success = await updateActivityProperties({
    eventId,
    signupEnabled,
    signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
    maxAttendees:
      maxAttendees !== undefined && maxAttendees !== null && maxAttendees !== ""
        ? Number(maxAttendees)
        : null,
    customIcon,
    description: description ?? "",
    public: isPublic,
    signupFields: (signupFields as SignupField[] | null) ?? null,
  });

  if (!success) throw new Error("Failed to update event");

  revalidateTag("activities", "max");
  revalidatePath("/activities");
  revalidatePath("/activities/manage");
  revalidatePath("/[locale]/activities/manage", "page");
  await triggerDebouncedCalendarSync("website_mutation", 3000);

  return { success: true, id: eventId };
}

export async function deleteActivityAction(id: string): Promise<{ success: boolean }> {
  await requirePermission("events:delete");

  await deleteActivitiesEvent(id);
  await cancelEventReminder(id);
  revalidateTag("activities", "max");
  revalidatePath("/activities");
  revalidatePath("/activities/manage");
  revalidatePath("/[locale]/activities/manage", "page");

  await triggerDebouncedCalendarSync("website_mutation", 1000);
  return { success: true };
}

export async function getEventRosterAction(id: string): Promise<Ticket[]> {
  const session = await requireUser();
  if (
    !hasPermission(session.user, "events:read") &&
    !hasPermission(session.user, "events:checkin")
  ) {
    throw new Error("Unauthorized");
  }
  return getEventAttendanceRoster(id);
}
