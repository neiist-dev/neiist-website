import { NextResponse } from "next/server";
import { DatabaseError } from "@/types/errors";

export function handleApiError(error: unknown) {
  if (error instanceof DatabaseError)
    return NextResponse.json(
      { error: error.userMessage, code: error.code },
      { status: error.statusCode }
    );

  console.error("API Error:", error);

  if (error instanceof Error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
