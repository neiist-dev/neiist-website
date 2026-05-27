import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser, createUser } from "@/utils/dbUtils";
import { signUserJWT } from "@/utils/authUtils";

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
  const clearedRedirectCookie = { name: "post_login_redirect", value: "", path: "/", maxAge: 0 };

  if (!authCode) {
    const res = NextResponse.json({ error: "No Auth Code Provided" }, { status: 400 });
    res.cookies.set(clearedStateCookie);
    res.cookies.set(clearedRedirectCookie);
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
      res.cookies.set(clearedRedirectCookie);
      return res;
    }

    const data = await r.json();
    const { access_token, refresh_token, expires_in } = data;

    if (!access_token) {
      const res = NextResponse.json({ error: "Access Token Missing" }, { status: 500 });
      res.cookies.set(clearedStateCookie);
      res.cookies.set(clearedRedirectCookie);
      return res;
    }
    const postLogin = cookieStore.get("post_login_redirect")?.value;
    const isSafe = typeof postLogin === "string" && postLogin.startsWith("/");
    const redirectUrl = isSafe
      ? new URL(postLogin, process.env.NEXT_PUBLIC_BASE_URL)
      : new URL("/?login=true", process.env.NEXT_PUBLIC_BASE_URL);

    const response = NextResponse.redirect(redirectUrl);

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
    response.cookies.set(clearedRedirectCookie);

    try {
      const personRes = await fetch("https://fenix.tecnico.ulisboa.pt/tecnico-api/v2/person", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (personRes.ok) {
        const info = await personRes.json();
        const istid = info.username;
        let user = await getUser(istid);
        if (!user) {
          const registrations = (info?.roles?.student?.registrations ?? []) as {
            degree?: {
              name?: Record<string, string> | string | null;
              acronym?: string | null;
            } | null;
          }[];
          const courses = [
            ...new Set(
              registrations
                .map((r) => {
                  const nameField = r?.degree?.name;
                  if (nameField && typeof nameField === "object") {
                    return (
                      nameField["pt-PT"] ??
                      nameField["en-GB"] ??
                      Object.values(nameField)[0] ??
                      r?.degree?.acronym ??
                      null
                    );
                  }
                  return (nameField as string) ?? r?.degree?.acronym ?? null;
                })
                .filter((c): c is string => Boolean(c))
            ),
          ];
          user = await createUser({
            istid,
            name: info.name ?? info.displayName,
            email: info.email ?? info.institutionalEmail ?? null,
            phone: info.phone ?? null,
            courses,
          });
        }
        if (user) {
          const jwtToken = signUserJWT({
            istid: user.istid,
            roles: user.roles,
            name: user.name,
            email: user.email,
          });
          response.cookies.set("session", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
          });
        }
      }
    } catch (error) {
      console.error("Failed to set session cookie during callback:", error);
    }

    return response;
  } catch (error) {
    console.error("Error in Callback:", error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.cookies.set(clearedStateCookie);
    res.cookies.set(clearedRedirectCookie);
    return res;
  }
}
