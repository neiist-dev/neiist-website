import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserData } from "@/src/utils/userUtils";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;

  if (!accessToken)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const fenixResponse = await fetch(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person?access_token=${accessToken}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!fenixResponse.ok)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const userInformation = await fenixResponse.json();
    const courses = userInformation.roles
      .filter((role: { type: string }) => role.type === "STUDENT")
      .flatMap((role: { registration?: { name: string; acronym: string }[] }) =>
        (role.registration || []).map((registration: { name: string; acronym: string }) => ({
          name: registration.name,
          acronym: registration.acronym,
        }))
      );

    const base64UserPhoto = "data:image/png;base64," + userInformation.photo.data;
    const userPhoto = validatePhoto(base64UserPhoto) ? (base64UserPhoto) : "/default_user.png";

    const userData: UserData = {
      username: userInformation.username,
      displayName: userInformation.displayName,
      email: userInformation.email,
      courses: courses,
      isActiveTecnicoStudent: userInformation.roles.some(
        (role: { type: string}) => role.type === 'STUDENT'),
      photo: userPhoto,
      status: "SocioRegular", //TODO Remove only for debug
      //TODO Later can fecth data from DB
    };

    return NextResponse.json(userData);

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

function validatePhoto(base64: string): boolean {
  // Check if the base64 string is a valid image format (PNG, JPEG, JPG)
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/;

  if (!base64Regex.test(base64)) {
    return false;
  }

  const base64Data = base64.split(',')[1];
  
  const byteLength = (base64Data.length * 3) / 4 - (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
  
  const maxSizeInBytes = 3 * 1024 * 1024; // 3MB

  return byteLength <= maxSizeInBytes;
}