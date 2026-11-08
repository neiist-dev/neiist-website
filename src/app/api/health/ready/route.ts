import { connection, NextResponse } from "next/server";
import { db_query } from "@/lib/db/connection";

const DB_TIMEOUT_MS = 1500;

export async function GET() {
  await connection();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("DB timeout")), DB_TIMEOUT_MS);
  });

  try {
    await Promise.race([db_query("SELECT 1"), timeout]);
    return NextResponse.json({ status: "ready" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
