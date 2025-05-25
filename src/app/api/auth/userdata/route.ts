import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserData, mapUserToUserData } from "@/types/user";
import { getUser, checkIsMember, checkIsCollaborator, createOrUpdateUser } from "@/utils/userDB";

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
      .flatMap((role: { registrations?: { name: string; acronym: string }[] }) =>
      (role.registrations || []).map((registration: { name: string; acronym: string }) => ({
        name: registration.name,
        acronym: registration.acronym,
      }))
      );

    interface Course {
      name: string;
      acronym: string;
    }

    const courseNames: string[] = courses.map((course: Course) => course.name);
    const fenixUserPhoto = "data:image/png;base64," + userInformation.photo.data;
    const validFenixPhoto = validatePhoto(fenixUserPhoto) ? fenixUserPhoto : null;
    const campus = typeof userInformation.campus === 'string'
      ? userInformation.campus.trim()
      : userInformation.campus || null;
    let dbUser = await getUser(userInformation.username);
        
    if (!dbUser) {
      dbUser = await createOrUpdateUser({
        istid: userInformation.username,
        name: userInformation.displayName,
        email: userInformation.email,
        courses: courseNames,
        campus: campus,
        permission: 'user'
      });
    } else {
      const updates: Partial<UserData> = {};
      if (!dbUser.courses || dbUser.courses.length === 0) {
        updates.courses = courseNames;
      }
      if (campus && (!dbUser.campus || dbUser.campus.length <= 1)) {
        updates.campus = campus;
      }
      if (Object.keys(updates).length > 0) {
        await createOrUpdateUser({
          istid: dbUser.istid,
          ...updates
        });
        dbUser = await getUser(userInformation.username);
      }
    }

    const isMember = dbUser ? await checkIsMember(dbUser.istid) : false;
    const isCollab = dbUser ? await checkIsCollaborator(dbUser.istid) : false;
    const isAdmin = dbUser?.permission === 'admin';
    const isGacMember = false;

    const isActiveLMeicStudent = courses.some(
      (course: { acronym: string }) => 
        course.acronym === 'MEIC-A' || course.acronym === 'MEIC-T'
    );

    let status = 'Regular';
    if (isMember) status = 'Member';
    if (isCollab) status = 'Collaborator';
    if (isAdmin) status = 'Admin';

    const userData: UserData = dbUser ?
      mapUserToUserData(dbUser, {
        isActiveTecnicoStudent: userInformation.roles.some(
          (role: { type: string}) => role.type === 'STUDENT'),
        isActiveLMeicStudent,
        isCollab,
        isAdmin,
        isGacMember,
        status,
        fenixPhoto: validFenixPhoto ?? undefined,
      }) : 
      {
        username: userInformation.username,
        displayName: userInformation.displayName,
        email: userInformation.email,
        courses: courseNames,
        campus: campus,
        isActiveTecnicoStudent: userInformation.roles.some(
          (role: { type: string}) => role.type === 'STUDENT'),
        isAdmin,
        isCollab,
        isGacMember,
        isActiveLMeicStudent,
        photo: validFenixPhoto || "/default_user.png",
        status: status,
      };
    
    const response = NextResponse.json(userData);
    response.cookies.set('userData', JSON.stringify({
      username: userData.username,
      isAdmin: userData.isAdmin,
      isCollab: userData.isCollab,
      status: userData.status,
      campus: userData.campus
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error in userdata API:', error);
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
