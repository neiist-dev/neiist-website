import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signUpToEvent, removeSignUpFromEvent } from "@/utils/dbUtils";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userDataCookie = cookieStore.get("user_data")?.value;
    if (!userDataCookie) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    const userData = JSON.parse(userDataCookie);
    const { eventId, signUp } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const success = signUp
      ? await signUpToEvent(eventId, userData.istid)
      : await removeSignUpFromEvent(eventId, userData.istid);

    if (!success) {
      return NextResponse.json({ error: "Failed to update sign-up" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUp: signUp,
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
