import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/utils/apiErrorUtils";
import { verifyPermission } from "@/lib/auth";
import { searchUsers } from "@/lib/search/userSearch";

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
