import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRole, mapRoleToUserRole } from "@/types/user";
import { updateActivityProperties, getEventSubscribers, getUser } from "@/utils/dbUtils";

async function checkAdminPermission(): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const isAdmin = currentUserRoles.includes(UserRole._ADMIN);

    if (!isAdmin) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Admin required" },
          { status: 403 }
        ),
      };
    }
    return { isAuthorized: true };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

export async function POST(req: NextRequest) {
  const { isAuthorized, error } = await checkAdminPermission();
  if (!isAuthorized) return error!;

  try {
    const { eventId, signupEnabled, signupDeadline, maxAttendees, customIcon, description } =
      await req.json();

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

export async function GET(req: NextRequest) {
  const { isAuthorized, error } = await checkAdminPermission();
  if (!isAuthorized) return error!;

  try {
    const eventId = req.nextUrl.searchParams.get("eventId");

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
