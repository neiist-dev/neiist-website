import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db_query } from "@/lib/db";
import { getUser, getUserRoles } from "@/utils/userDB";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsedUserData = JSON.parse(userData);

  // Only admins can view all users
  if (!parsedUserData.isAdmin) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Get all user IDs and names for ordering
    const { rows } = await db_query(`
      SELECT istid, name FROM public.users ORDER BY name
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

      return {
        username: user.istid,
        displayName: user.name,
        email: user.email,
        campus: user.campus,
        courses: user.courses || [],
        photo: user.photoData || '/default_user.png',
        status,
        roles
      };
    }));

    // Filter out null values
    const validUsers = users.filter(user => user !== null);

    return NextResponse.json(validUsers);

  } catch (error) {
    console.error('Error fetching all users:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}