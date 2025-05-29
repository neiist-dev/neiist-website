import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { 
  getUser, 
  createOrUpdateUser, 
  addMember, 
  addCollaborator, 
  addAdmin, 
  removeRole,
  getUserRoles,
  updateCollaboratorTeams
} from "@/utils/dbUtils";
import { db_query } from "@/lib/db";

export async function PUT(request: Request) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsedUserData = JSON.parse(userData);
  // Only admins can update user roles
  if (!parsedUserData.isAdmin) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const updateData = await request.json();
    const { username, roles: newRoles, teams, position, ...otherUpdates } = updateData;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    const existingUser = await getUser(username);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map frontend field names to database column names
    const mappedUpdates: Record<string, unknown> = {};
    Object.entries(otherUpdates).forEach(([key, value]) => {
      switch (key) {
        case 'displayName':
          mappedUpdates.name = value;
          break;
        case 'email':
        case 'campus':
        case 'courses':
        case 'phone':
          mappedUpdates[key] = value;
          break;

        default:
          console.log(`Ignoring field: ${key}`);
          break;
      }
    });

    if (Object.keys(mappedUpdates).length > 0) {
      console.log('Updating user with:', mappedUpdates);
      await createOrUpdateUser({
        istid: username,
        ...mappedUpdates
      });
    }

    if (newRoles && Array.isArray(newRoles)) {
      const currentRoles = await getUserRoles(username);
      const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
      const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

      for (const role of rolesToRemove) {
        await removeRole(username, role);
      }
      for (const role of rolesToAdd) {
        switch (role) {
          case 'member':
            await addMember(username);
            break;
          case 'collaborator':
            await addCollaborator(
              username, 
              teams || [], 
              position || 'Collaborator',
              updateData.fromDate ? new Date(updateData.fromDate) : new Date(),
              updateData.toDate ? new Date(updateData.toDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            );
            break;
          case 'admin':
            await addAdmin(username);
            break;
        }
      }

      if (newRoles.includes('collaborator') && (teams || position)) {
        if (teams && Array.isArray(teams)) {
          await updateCollaboratorTeams(username, teams);
        }
        if (position) {
          await db_query(
            `UPDATE neiist.roles 
             SET position = $1
             WHERE istid = $2 AND role_type = 'collaborator'`,
            [position, username]
          );
        }
      }
    } else {
      const currentRoles = await getUserRoles(username);
      if (currentRoles.includes('collaborator') && (teams || position)) {

        if (teams && Array.isArray(teams)) {
          await updateCollaboratorTeams(username, teams);
        }
        if (position) {
          await db_query(
            `UPDATE neiist.roles 
             SET position = $1
             WHERE istid = $2 AND role_type = 'collaborator'`,
            [position, username]
          );
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully" 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}