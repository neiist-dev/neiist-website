import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser, getUserRoles } from "@/utils/dbUtils";
import { UserData } from "@/types/user";
import { hasRole, apiError, mapDbUserAndRolesToUserData } from "@/utils/permissionsUtils";
import { db_query } from "@/lib/db";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json(apiError("Not authenticated", 401), { status: 401 });
  }

  const parsedUserData: UserData = JSON.parse(userData);

  if (!hasRole(parsedUserData, ['Member', 'Collaborator', 'Admin'])) {
    return NextResponse.json(apiError("Insufficient permissions", 403), { status: 403 });
  }

  try {
    const { rows } = await db_query(`
      SELECT DISTINCT u.istid
      FROM public.users u
      INNER JOIN neiist.roles r ON u.istid = r.istid
      WHERE r.role_type IN ('member', 'collaborator', 'admin')
      ORDER BY u.name
    `);

    const users = await Promise.all(rows.map(async ({ istid }) => {
      const user = await getUser(istid);
      if (!user) return null;
      const roleDetails = await getUserRoles(istid);
      return mapDbUserAndRolesToUserData(user, roleDetails);
    }));

    return NextResponse.json(users.filter(Boolean));
  } catch (error) {
    console.error('Error fetching collaborators and members:', error);
    return NextResponse.json(apiError("Internal server error", 500, error instanceof Error ? error.message : undefined), { status: 500 });
  }
}
