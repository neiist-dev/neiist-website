import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/utils/apiErrorUtils";
import { verifyPermission } from "@/lib/auth";
import { searchUsers } from "@/lib/search/userSearch";
import { createUser, getUserNoCache } from "@/lib/db/repositories/user.repository";
import { IST_ID_REGEX, EMAIL_REGEX } from "@/utils/userUtils";

export async function GET(request: NextRequest) {
  const auth = await verifyPermission(["users:read", "pos:access"], { match: "any" });
  if (auth.error) return auth.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const rawSearch = searchParams.get("search")?.trim() || "";

    const result = await searchUsers(rawSearch, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyPermission(
    ["users:write", "pos:access", "memberships:write_global", "memberships:write_dept"],
    { match: "any" }
  );
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const istid = typeof body.istid === "string" ? body.istid.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!IST_ID_REGEX.test(istid))
      return NextResponse.json(
        { error: "Invalid IST ID format (e.g. ist1109687)" },
        { status: 400 }
      );

    if (!name || !EMAIL_REGEX.test(email))
      return NextResponse.json({ error: "Valid name and email are required" }, { status: 400 });

    const existing = await getUserNoCache(istid);
    if (existing) return NextResponse.json({ user: existing, existed: true }, { status: 200 });

    const created = await createUser({ istid, name, email, phone: null, courses: [] });
    if (!created) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    return NextResponse.json({ user: created, existed: false }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
