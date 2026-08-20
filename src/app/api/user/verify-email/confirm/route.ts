import { NextRequest, NextResponse } from "next/server";
import {
  getEmailVerification,
  deleteEmailVerification,
  updateUser,
} from "@/lib/db/repositories/user.repository";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const record = await getEmailVerification(token);

    if (!record) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "Expired token" }, { status: 400 });
    }

    await updateUser(record.istid, { alternativeEmail: record.email });
    await deleteEmailVerification(token);

    return NextResponse.redirect(new URL("/email-confirmation", req.url));
  } catch (error) {
    return handleApiError(error);
  }
}
