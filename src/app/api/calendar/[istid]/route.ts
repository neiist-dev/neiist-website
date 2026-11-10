import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getOrCreateUserCalendar,
  getAddCalendarLink,
  getCalendarWebLink,
  syncEventsToCalendarBatched,
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
    const calendarId = await getOrCreateUserCalendar(
      user.email,
      istid,
      user.name,
      alternativeEmail
    );

    if (!calendarId) return NextResponse.json({ addCalendarLink: "", webViewLink: "" });

    const events = await getActivitiesEvents(false);
    const synced = await syncEventsToCalendarBatched(
      calendarId,
      events,
      user.email,
      alternativeEmail
    );

    const addCalendarLink = await getAddCalendarLink(calendarId);
    const webViewLink = await getCalendarWebLink(calendarId);

    const payload = {
      calendarId,
      calendarName: `NEIIST-${getFirstAndLastName(user.name)}`,
      addCalendarLink,
      webViewLink,
      sharedWith: [user.email, ...(alternativeEmail ? [alternativeEmail] : [])],
      eventsSynced: synced,
    };

    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
