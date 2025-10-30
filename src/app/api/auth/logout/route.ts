import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("t", Date.now().toString());

  const res = NextResponse.redirect(redirectUrl);
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

  del("access_token");
  del("user_data");
  del("fenix_oauth_state");

  return res;
}
