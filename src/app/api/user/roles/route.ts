import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db_query } from "@/lib/db";
import { getUserRoles } from "@/utils/userDB";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsedUserData = JSON.parse(userData);

  try {
    // Get user's roles
    const roles = await getUserRoles(parsedUserData.username);

    if (roles.length === 0) {
      return NextResponse.json({ roles: [] });
    }

    // Get additional role information
    const roleDetails = await db_query(`
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
    `, [parsedUserData.username]);

    const memberInfo = roleDetails.rows.find(r => r.role_type === 'member');
    const collabInfo = roleDetails.rows.find(r => r.role_type === 'collaborator');

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

    return NextResponse.json({
      roles,
      teams,
      position: collabInfo?.position,
      registerDate: memberInfo?.register_date,
      electorDate: memberInfo?.elector_date,
      fromDate: collabInfo?.from_date,
      toDate: collabInfo?.to_date
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}