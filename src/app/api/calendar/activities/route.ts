import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { updateActivityProperties, getEventSubscribers } from "@/utils/db/eventQueries";
import { serverCheckRoles } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const { eventId, signupEnabled, signupDeadline, maxAttendees, customIcon, description } =
      await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const success = await updateActivityProperties({
      eventId,
      signupEnabled,
      signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
      maxAttendees,
      customIcon,
      description: description ?? null,
    });

    if (!success) {
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }

    revalidateTag("activities", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const subscribers = await getEventSubscribers(eventId);

    return NextResponse.json({ subscribers });
  } catch (error) {
    return handleApiError(error);
  }
}
