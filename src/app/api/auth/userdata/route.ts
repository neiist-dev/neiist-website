import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserData, mapUserToUserData } from "@/types/user";
import { getUser, checkIsMember, checkIsCollaborator, checkIsAdmin, createOrUpdateUser } from "@/utils/dbUtils";

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

    // Get role details if user has roles
    let roleDetails = {
      roles: [] as string[],
      teams: [] as string[],
      position: undefined as string | undefined,
      registerDate: undefined as string | undefined,
      electorDate: undefined as string | undefined,
      fromDate: undefined as string | undefined,
      toDate: undefined as string | undefined,
    };

    if (dbUser && (isMember || isCollab || isAdmin)) {
      // Get user's roles
      const roles = await getUserRoles(dbUser.istid);
      
      if (roles.length > 0) {
        // Get additional role information
        const roleDetailsQuery = await db_query(`
          SELECT 
            role_type,
            teams,
            position,
            register_date,
            elector_date,
            from_date,
            to_date
          FROM neiist.roles 
          WHERE istid = $1
        `, [dbUser.istid]);

        const memberInfo = roleDetailsQuery.rows.find(r => r.role_type === 'member');
        const collabInfo = roleDetailsQuery.rows.find(r => r.role_type === 'collaborator');

        // Normalize teams to ensure it's always an array
        let teams: string[] = [];
        if (collabInfo?.teams) {
          if (Array.isArray(collabInfo.teams)) {
            teams = collabInfo.teams;
          } else if (typeof collabInfo.teams === 'string') {
            teams = collabInfo.teams.startsWith('{') && collabInfo.teams.endsWith('}')
              ? collabInfo.teams.slice(1, -1).split(',').filter(t => t.trim().length > 0)
              : [collabInfo.teams];
          }
        }

        roleDetails = {
          roles,
          teams,
          position: collabInfo?.position,
          registerDate: memberInfo?.register_date,
          electorDate: memberInfo?.elector_date,
          fromDate: collabInfo?.from_date,
          toDate: collabInfo?.to_date
        };
      }
    }

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
