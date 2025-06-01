import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserData, mapUserToUserData } from "@/types/user";
import { apiError } from "@/utils/permissionsUtils";
import { getUser, checkIsMember, checkIsCollaborator, checkIsAdmin, createOrUpdateUser, getUserRoles, updateUserPhoto } from "@/utils/dbUtils";

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
      });
      if (dbUser && validFenixPhoto) {
        await updateUserPhoto(dbUser.istid, validFenixPhoto);
        dbUser = await getUser(userInformation.username);
      }
    } else {
      const updates: Record<string, unknown> = {};
      if (dbUser.email !== userInformation.email) {
        updates.email = userInformation.email;
      }
      if (dbUser.name !== userInformation.displayName) {
        if (dbUser.name.includes('Pending User')) {
          updates.name = userInformation.displayName;
        }
      }
      if (!dbUser.courses || dbUser.courses.length === 0 || 
          JSON.stringify(dbUser.courses.sort()) !== JSON.stringify(courseNames.sort())) {
        updates.courses = courseNames;
      }
      if (campus && (!dbUser.campus || dbUser.campus.length <= 1 || dbUser.campus !== campus)) {
        updates.campus = campus;
      }
      if (Object.keys(updates).length > 0) {
        console.log('Updating user with Fenix data:', updates);
        await createOrUpdateUser({
          istid: dbUser.istid,
          ...updates
        });
      }

      if (validFenixPhoto) {
        let shouldUpdatePhoto = false;

        if (!dbUser.photo) {
          // No photo exists, use Fenix photo
          shouldUpdatePhoto = true;
        } else if (dbUser.photoData && dbUser.photoData !== validFenixPhoto) {
          // Photo exists but is different from Fenix
          // Only update if current photo looks like it came from Fenix (not a custom upload)
          if (dbUser.photoData.startsWith('data:image/png;base64,')) {
            shouldUpdatePhoto = true;
          }
        }

        if (shouldUpdatePhoto) {
          await updateUserPhoto(dbUser.istid, validFenixPhoto);
        }
      }
      dbUser = await getUser(userInformation.username);
    }

    const isMember = dbUser ? await checkIsMember(dbUser.istid) : false;
    const isCollab = dbUser ? await checkIsCollaborator(dbUser.istid) : false;
    const isAdmin = dbUser ? await checkIsAdmin(dbUser.istid) : false;
    const isGacMember = false;

    const isActiveLMeicStudent = courses.some(
      (course: { acronym: string }) => 
        course.acronym === 'MEIC-A' || course.acronym === 'MEIC-T'
    );

    let status = 'Regular';
    if (isMember) status = 'Member';
    if (isCollab) status = 'Collaborator';
    if (isAdmin) status = 'Admin';

    const roleDetails = dbUser && (isMember || isCollab || isAdmin) 
      ? await getUserRoles(dbUser.istid)
      : {
          roles: [] as string[],
          teams: [] as string[],
          position: undefined as string | undefined,
          registerDate: undefined as string | undefined,
          electorDate: undefined as string | undefined,
          fromDate: undefined as string | undefined,
          toDate: undefined as string | undefined,
          startRenewalDate: undefined as string | undefined,
          endRenewalDate: undefined as string | undefined,
          renewalNotification: undefined as boolean | undefined,
        };

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
        ...roleDetails
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
        ...roleDetails
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
    return NextResponse.json(apiError("Internal server error", 500, error instanceof Error ? error.message : undefined), { status: 500 });
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
