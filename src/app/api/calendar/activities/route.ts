import { NextRequest, NextResponse } from "next/server";
import {
  updateActivityProperties,
  getEventSubscribers,
} from "@/lib/db/repositories/event.repository";
import { verifyPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(request: NextRequest) {
  const auth = await verifyPermission("departments:write");
  if (auth.error) return auth.error;

  const { eventId, signupEnabled, signupDeadline, maxAttendees, customIcon, description } =
    await request.json();

  if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

  try {
    const success = await updateActivityProperties({
      eventId,
      signupEnabled,
      signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
      maxAttendees,
      customIcon,
      description: description ?? null,
    });

    if (!success) return NextResponse.json({ error: "Failed to update event" }, { status: 500 });

    revalidatePath("/activities");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyPermission("departments:read");
  if (auth.error) return auth.error;

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

  try {
    const subscribers = await getEventSubscribers(eventId);
    return NextResponse.json({ subscribers });
  } catch (error) {
    return handleApiError(error);
  }
}
