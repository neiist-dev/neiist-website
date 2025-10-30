import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const refresh_token = (await cookies()).get("refresh_token")?.value;
  if (!refresh_token) return NextResponse.json({ error: "No Refresh Token" }, { status: 401 });

  const body = new URLSearchParams({
    client_id: process.env.FENIX_CLIENT_ID!,
    client_secret: process.env.FENIX_CLIENT_SECRET!,
    refresh_token,
    grant_type: "refresh_token",
  });

  const r = await fetch("https://fenix.tecnico.ulisboa.pt/oauth/refresh_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!r.ok) return NextResponse.json({ error: "Failed to Refresh" }, { status: 401 });

  const { access_token, expires_in } = await r.json();
  const res = NextResponse.json({ ok: true, expires_in });
  res.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.max(0, (Number(expires_in) || 3600) - 60),
    path: "/",
  });
  return res;
}
