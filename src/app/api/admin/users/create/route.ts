import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addMember, addCollaborator, addAdmin, getUser, getUserRoles } from "@/utils/dbUtils";
import { UserData } from "@/types/user";
import { apiError, isAdmin } from "@/utils/permissionsUtils";
import { db_query } from "@/lib/db";

export async function POST(request: Request) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json(apiError("Not authenticated", 401), { status: 401 });
  }

  const parsedUserData: UserData = JSON.parse(userData);
  if (!isAdmin(parsedUserData)) {
    return NextResponse.json(apiError("Insufficient permissions", 403), { status: 403 });
  }

  let createData: Partial<UserData> = {};

  try {
    createData = await request.json();
    const { 
      username,
      roles,
      teams,
      position,
      registerDate,
      electorDate,
      fromDate,
      toDate,
    } = createData;

    if (!username || !roles || roles.length === 0) {
      return NextResponse.json(apiError("IST ID and at least one role are required", 400), { status: 400 });
    }

    // Validate IST ID format
    if (!/^ist1\d{6}$/.test(username)) {
      return NextResponse.json(apiError("Invalid IST ID format. Use: ist1xxxxxx", 400), { status: 400 });
    }

    const existingUser = await getUser(username);
    if (existingUser) {
      return NextResponse.json(apiError("User already exists", 409), { status: 409 });
    }
    const existingRoles = await getUserRoles(username);
    if (existingRoles.roles.length > 0) {
      return NextResponse.json(apiError("User already has NEIIST roles assigned", 409), { status: 409 });
    }

    await addMember(
      username,
      registerDate ? new Date(registerDate) : new Date(),
      electorDate ? new Date(electorDate) : undefined
    );

    if (roles.includes('collaborator')) {
      if (!fromDate || !toDate) {
        throw new Error('Collaborator role requires from and to dates');
      }
      await addCollaborator(
        username,
        teams || [],
        position || 'Collaborator',
        new Date(fromDate),
        new Date(toDate)
      );
    }
    if (roles.includes('admin')) {
      await addAdmin(username);
    }

    return NextResponse.json({ 
      success: true, 
      message: "User created successfully. They will have their full profile populated when they first login with Fenix.",
      istid: username
    });

  } catch (error) {
    console.error('Error creating user:', error);
    // Cleanup 
    if (createData?.username) {
      try {
        await db_query('DELETE FROM public.users WHERE istid = $1', [createData.username]);
        await db_query('DELETE FROM neiist.roles WHERE istid = $1', [createData.username]);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    return NextResponse.json(apiError("Internal server error", 500, error instanceof Error ? error.message : undefined), { status: 500 });
  }
}
