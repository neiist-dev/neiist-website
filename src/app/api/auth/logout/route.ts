import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin || "http://localhost:3000";

  const redirectUrl = new URL("/", baseUrl);
  redirectUrl.searchParams.set("t", Date.now().toString());

  const res = NextResponse.redirect(redirectUrl, 303);
  res.headers.set("Cache-Control", "no-store");

  type CookieOptions = Parameters<typeof res.cookies.set>[2];

  const del = (name: string, opts: Partial<CookieOptions> = {}) => {
    const defaults: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    };
    return res.cookies.set(name, "", { ...defaults, ...opts });
  };

  del("session");
  del("fenix_oauth_state");
  del("post_login_redirect");

  return res;
}
