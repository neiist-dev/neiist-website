import { NextResponse } from "next/server";
import { DatabaseError } from "@/types/errors";
import { InsufficientStockError } from "@/lib/redis/holds";

export function handleApiError(error: unknown) {
  if (error instanceof InsufficientStockError)
    return NextResponse.json({ error: error.message }, { status: 409 });

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
