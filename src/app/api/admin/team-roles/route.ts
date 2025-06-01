import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTeamRoles } from "@/utils/dbUtils";
import { UserData } from "@/types/user";
import { hasRole, apiError } from "@/utils/permissionsUtils";

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
    const teamRoles = await getTeamRoles();
    return NextResponse.json(teamRoles);
  } catch (error) {
    console.error('Error fetching team roles:', error);
    return NextResponse.json(apiError("Internal server error", 500, error instanceof Error ? error.message : undefined), { status: 500 });
  }
}
