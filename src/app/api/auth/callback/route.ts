import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get('code');

  if (!authCode) {
    return NextResponse.json({ error: 'No authCode provided' },
      { status: 400 });
  }

  try {
    const url = `https://fenix.tecnico.ulisboa.pt/oauth/access_token`;
    const body = new URLSearchParams({
      client_id: process.env.FENIX_CLIENT_ID!,
      client_secret: process.env.FENIX_CLIENT_SECRET!,
      redirect_uri: process.env.FENIX_REDIRECT_URI!,
      code: authCode,
      grant_type: 'authorization_code',
    });

    const accessTokenResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!accessTokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to retrieve access token' },
        { status: 500 });
    }

    const data = await accessTokenResponse.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token not found in response' },
        { status: 500 });
    }

    const response = NextResponse.redirect(new URL('/?login=true', request.url));
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ error: 'Internal server error' },
      { status: 500 });
  }
}
