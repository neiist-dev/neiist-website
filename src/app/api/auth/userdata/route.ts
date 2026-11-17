import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  const session = await getAuthenticatedUser();
  return NextResponse.json(session?.user ?? null);
}
