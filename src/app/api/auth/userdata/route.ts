import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/utils/apiErrorUtils";
import { syncFenixUserAndCreateSession, setSessionCookie } from "@/lib/security/authSession";

export async function GET() {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ error: "Not Authenticated." }, { status: 401 });

  try {
    const result = await syncFenixUserAndCreateSession(accessToken);
    if (!result)
      return NextResponse.json({ error: "Invalid/Expired Token or sync failed" }, { status: 401 });

    const response = NextResponse.json(result.user);
    setSessionCookie(response, result.sessionToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
