import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET() {
  try {
    const session = await getAuthenticatedUser();
    return NextResponse.json(session?.user ?? null);
  } catch (error) {
    return handleApiError(error);
  }
}
