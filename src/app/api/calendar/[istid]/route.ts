import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getOrCreateUserCalendar,
  getAddCalendarLink,
  syncAllEventsToCalendar,
} from "@/lib/google/calendar";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getActivitiesEvents } from "@/lib/db/repositories/event.repository";
import { getUser } from "@/lib/db/repositories/user.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateIstId } from "@/utils/apiValidationUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ istid: string }> }
) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const jwtUser = auth.user;

  const [istid, error] = validateIstId((await params).istid);
  if (error) return error;

  if (jwtUser.istid !== istid)
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

  try {
    const user = await getUser(istid);
    if (!user || !user.email)
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });

    const alternativeEmailRaw = user.alternativeEmailVerified ? user.alternativeEmail : undefined;
    const alternativeEmail = alternativeEmailRaw ?? undefined;
    const neiistEmail = user.neiistEmail ?? undefined;
    const calendarName = `NEIIST-${getFirstAndLastName(user.name)}`;
    const calendarId = await getOrCreateUserCalendar(
      user.email,
      istid,
      user.name,
      alternativeEmail
    );

    if (!calendarId) return NextResponse.json({ addCalendarLink: "" });

    const events = await getActivitiesEvents(false);
    const syncStats = await syncAllEventsToCalendar(
      calendarId,
      events,
      user.email,
      alternativeEmail,
      neiistEmail
    );

    const addCalendarLink = await getAddCalendarLink(calendarId);

    const payload = {
      calendarId,
      calendarName,
      addCalendarLink,
      sharedWith: [user.email, ...(alternativeEmail ? [alternativeEmail] : [])],
      eventsSynced: syncStats.updated + syncStats.deleted,
    };

    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
