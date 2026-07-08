import { NextResponse } from "next/server";
import { DatabaseError } from "@/types/errors";

export function handleApiError(err: unknown) {
  if (err instanceof DatabaseError)
    return NextResponse.json({ error: err.userMessage }, { status: err.statusCode });

  console.error("API Error:", err);

  if (err instanceof Error)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
