import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSafeReturnUrl } from "@/lib/security/urlUtils";

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");

  const url = new URL("https://fenix.tecnico.ulisboa.pt/oauth/userdialog");
  url.searchParams.set("client_id", process.env.FENIX_CLIENT_ID!);
  url.searchParams.set("redirect_uri", process.env.FENIX_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read:personal");
  url.searchParams.set("state", state);

  const rawParam =
    req.nextUrl.searchParams.get("returnUrl") ?? req.nextUrl.searchParams.get("redirect");
  const returnUrl = rawParam ? getSafeReturnUrl(rawParam, "") : "";

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("fenix_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  if (returnUrl) {
    res.cookies.set("post_login_redirect", returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  }

  return res;
}
