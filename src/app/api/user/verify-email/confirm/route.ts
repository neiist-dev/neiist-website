import { NextResponse } from "next/server";
import { getEmailVerification, deleteEmailVerification, updateUser } from "@/utils/dbUtils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
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

  return NextResponse.redirect(new URL("/email-confirmation", request.url));
}
