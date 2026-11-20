import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getOrCreatePublicCalendar,
  getOrCreateUserCalendar,
  getAddCalendarLink,
  syncAllEventsToCalendar,
} from "@/lib/google/calendar";
import { checkRoles, UserRole } from "@/types/roles";
import { getUserCalendarEmails } from "@/utils/calendarUtils";
import { getFirstAndLastName } from "@/utils/userUtils";
import { getActivitiesEvents } from "@/lib/db/repositories/event.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateIstId } from "@/utils/apiValidationUtils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ istid: string }> }
) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { user } = auth;

  const [istid, error] = validateIstId((await params).istid);
  if (error) return error;

  if (user.istid !== istid)
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

  try {
    const isMember = checkRoles(user, [UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN]);

    if (!isMember) {
      const publicCal = await getOrCreatePublicCalendar();
      if (!publicCal) return NextResponse.json({ addCalendarLink: "" });

      let eventsSynced = 0;
      if (publicCal.created) {
        const syncStats = await syncAllEventsToCalendar(
          publicCal.calendarId,
          await getActivitiesEvents(true)
        );
        eventsSynced = syncStats.updated + syncStats.deleted;
      }

      return NextResponse.json({
        calendarId: publicCal.calendarId,
        calendarName: "NEIIST",
        addCalendarLink: await getAddCalendarLink(publicCal.calendarId),
        eventsSynced,
      });
    }

    if (!user.email)
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });

    const calendarName = `NEIIST-${getFirstAndLastName(user.name)}`;
    const calendarId = await getOrCreateUserCalendar(istid, user.name);
    if (!calendarId) return NextResponse.json({ addCalendarLink: "" });

    const syncStats = await syncAllEventsToCalendar(
      calendarId,
      await getActivitiesEvents(false),
      getUserCalendarEmails(user)
    );

    return NextResponse.json({
      calendarId,
      calendarName,
      addCalendarLink: await getAddCalendarLink(calendarId),
      eventsSynced: syncStats.updated + syncStats.deleted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
