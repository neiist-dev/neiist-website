import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { signUpToEvent, removeSignUpFromEvent } from "@/lib/db/repositories/event.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionToken = cookieStore.get("session")?.value;
    const jwtUser = sessionToken ? await verifyJWTWebCrypto(sessionToken) : null;
    if (!jwtUser) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    const { eventId, signUp } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    const success = signUp
      ? await signUpToEvent(eventId, jwtUser.istid)
      : await removeSignUpFromEvent(eventId, jwtUser.istid);

    if (!success) return NextResponse.json({ error: "Failed to update sign-up" }, { status: 500 });

    revalidatePath("/activities");

    return NextResponse.json({
      success: true,
      signedUp: signUp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
