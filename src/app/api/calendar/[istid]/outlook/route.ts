import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db/repositories/user.repository";
import { isM365Configured } from "@/lib/m365/graph";
import { enqueueOutlookCalendarSync } from "@/lib/redis/queue";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateIstId } from "@/utils/apiValidationUtils";

export async function POST(
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
    const body = await request.json();
    const enabled = Boolean(body?.enabled);

    const user = await getUser(istid);
    if (!user || !user.email)
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });

    if (!user.neiistEmail)
      return NextResponse.json(
        { error: "NEIIST email is required for Outlook calendar sync" },
        { status: 400 }
      );

    if (!isM365Configured())
      return NextResponse.json(
        { error: "Microsoft 365 integration is not configured" },
        { status: 503 }
      );

    await updateUser(istid, { outlookCalendarSync: enabled });
    await enqueueOutlookCalendarSync(istid, enabled);

    return NextResponse.json({
      success: true,
      enabled,
      queued: true,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
