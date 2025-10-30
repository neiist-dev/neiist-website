import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("fenix_oauth_state")?.value;

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth State" }, { status: 400 });
  }

  const clearedStateCookie = { name: "fenix_oauth_state", value: "", path: "/", maxAge: 0 };

  if (!authCode) {
    const res = NextResponse.json({ error: "No Auth Code Provided" }, { status: 400 });
    res.cookies.set(clearedStateCookie);
    return res;
  }

  try {
    const body = new URLSearchParams({
      client_id: process.env.FENIX_CLIENT_ID!,
      client_secret: process.env.FENIX_CLIENT_SECRET!,
      redirect_uri: process.env.FENIX_REDIRECT_URI!,
      code: authCode,
      grant_type: "authorization_code",
    });

    const r = await fetch("https://fenix.tecnico.ulisboa.pt/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!r.ok) {
      const res = NextResponse.json({ error: "Failed to Retrieve Access Token" }, { status: 500 });
      res.cookies.set(clearedStateCookie);
      return res;
    }

    const data = await r.json();
    const { access_token, refresh_token, expires_in } = data;

    if (!access_token) {
      const res = NextResponse.json({ error: "Access Token Missing" }, { status: 500 });
      res.cookies.set(clearedStateCookie);
      return res;
    }

    const response = NextResponse.redirect(new URL("/?login=true", request.url));

    response.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: Math.max(0, (Number(expires_in) || 3600) - 60),
      path: "/",
    });
    if (refresh_token) {
      response.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
    response.cookies.set(clearedStateCookie);
    return response;
  } catch (error) {
    console.error("Error in Callback:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.cookies.set(clearedStateCookie);
    return res;
  }
}
