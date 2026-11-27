import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
