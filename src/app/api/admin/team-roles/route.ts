import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db_query } from "@/lib/db";

export async function GET() {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsedUserData = JSON.parse(userData);

  // Only members, collaborators, and admins can view team roles
  if (!['Member', 'Collaborator', 'Admin'].includes(parsedUserData.status)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Get all enum values for team roles
    const { rows } = await db_query(`
      SELECT enumlabel as role_name 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'team_role_enum' AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'neiist'
        )
      )
      ORDER BY enumlabel
    `);
    const teamRoles = rows.map(row => row.role_name);
    const formattedRoles = teamRoles.map((role: string) => ({
      value: role,
      label: role.includes('COOR-') ? `Coordinator - ${role.replace('COOR-', '')}` : role,
      isCoordinator: role.includes('COOR-')
    }));

    return NextResponse.json(formattedRoles);

  } catch (error) {
    console.error('Error fetching team roles:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
