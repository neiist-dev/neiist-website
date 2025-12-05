import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { updateActivityProperties, getEventSubscribers } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    console.error("Subscribers fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
