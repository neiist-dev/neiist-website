import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@/types/user";
import { getUser, createUser } from "@/utils/dbUtils";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not Authenticated." }, { status: 401 });
  }

  try {
    const fenixResponse = await fetch(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person?access_token=${accessToken}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!fenixResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userInformation = await fenixResponse.json();
    let user = await getUser(userInformation.username);

    if (!user) {
      user = await createUser({
        istid: userInformation.username,
        name: userInformation.name,
        email: userInformation.email,
        phone: userInformation.phone,
        courses: userInformation.roles
          .filter((role: { type: string }) => role.type === "STUDENT")
          .flatMap((role: { registrations?: { name: string }[] }) =>
          (role.registrations || []).map((registration: { name: string }) =>
            registration.name)
          )
      });

      if (!user) {
        return NextResponse.json({ error: "Failed to create user" },
          { status: 500 });
      }
    }

    const userWithPhotoPath = user as User & { photo_path?: string };
    user.photo = userWithPhotoPath.photo_path || `/api/user/photo/${user.istid}`;

    const response = NextResponse.json(user);
    response.cookies.set('userData', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error in userdata API:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}