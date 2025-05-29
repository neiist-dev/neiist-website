import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db_query } from "@/lib/db";
import { getUser, getUserRoles } from "@/utils/dbUtils";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsedUserData = JSON.parse(userData);

  // Check if user has permission to view this data
  if (!['Member', 'Collaborator', 'Admin'].includes(parsedUserData.status)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Get all users who have member, collaborator, or admin roles
    const { rows } = await db_query(`
      SELECT DISTINCT u.istid, u.name
      FROM public.users u
      INNER JOIN neiist.roles r ON u.istid = r.istid
      WHERE r.role_type IN ('member', 'collaborator', 'admin')
      ORDER BY u.name
    `);

    // Use existing functions to get complete user data
    const users = await Promise.all(rows.map(async (row) => {
      const user = await getUser(row.istid);
      if (!user) return null;

      const roles = await getUserRoles(row.istid);

      // Determine primary status based on roles hierarchy
      let status = 'Regular';
      if (roles.includes('admin')) status = 'Admin';
      else if (roles.includes('collaborator')) status = 'Collaborator';
      else if (roles.includes('member')) status = 'Member';

      // Get additional role-specific information
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
      `, [row.istid]);

      const memberInfo = roleDetails.rows.find(r => r.role_type === 'member');
      const collabInfo = roleDetails.rows.find(r => r.role_type === 'collaborator');

      // Normalize teams to ensure it's always an array
      let teams: string[] = [];
      if (collabInfo?.teams) {
        if (Array.isArray(collabInfo.teams)) {
          teams = collabInfo.teams;
        } else if (typeof collabInfo.teams === 'string') {
          // Handle PostgreSQL array format
          teams = collabInfo.teams.startsWith('{') && collabInfo.teams.endsWith('}')
            ? collabInfo.teams.slice(1, -1).split(',').filter(t => t.trim().length > 0)
            : [collabInfo.teams];
        }
      }

      return {
        username: user.istid,
        displayName: user.name,
        email: user.email,
        campus: user.campus,
        courses: user.courses || [],
        photo: user.photoData || '/default_user.png',
        status,
        roles,
        teams,
        position: collabInfo?.position,
        registerDate: memberInfo?.register_date,
        electorDate: memberInfo?.elector_date,
        fromDate: collabInfo?.from_date,
        toDate: collabInfo?.to_date
      };
    }));

    // Filter out null values
    const validUsers = users.filter(user => user !== null);

    return NextResponse.json(validUsers);

  } catch (error) {
    console.error('Error fetching collaborators and members:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}