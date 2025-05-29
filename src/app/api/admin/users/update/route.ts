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
} from "@/utils/userDB";
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
    console.log('Received update data:', updateData); // Debug log

    const { username, roles: newRoles, teams, position, ...otherUpdates } = updateData;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Check if user exists using existing function
    const existingUser = await getUser(username);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map frontend field names to database column names
    const mappedUpdates: any = {};
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
        // Ignore other fields that shouldn't be updated directly
        default:
          console.log(`Ignoring field: ${key}`);
          break;
      }
    });

    // Update basic user information if provided using existing function
    if (Object.keys(mappedUpdates).length > 0) {
      console.log('Updating user with:', mappedUpdates);
      await createOrUpdateUser({
        istid: username,
        ...mappedUpdates
      });
    }

    // Handle role updates if provided using existing functions
    if (newRoles && Array.isArray(newRoles)) {
      const currentRoles = await getUserRoles(username);
      const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
      const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

      console.log('Current roles:', currentRoles);
      console.log('New roles:', newRoles);
      console.log('Roles to add:', rolesToAdd);
      console.log('Roles to remove:', rolesToRemove);

      // Remove roles that are no longer needed using existing function
      for (const role of rolesToRemove) {
        await removeRole(username, role);
      }

      // Add new roles using existing functions
      for (const role of rolesToAdd) {
        switch (role) {
          case 'member':
            await addMember(username);
            break;
          case 'collaborator':
            // For collaborator, we might need additional data
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

      // Update collaborator-specific information if user is/becomes a collaborator
      if (newRoles.includes('collaborator') && (teams || position)) {
        console.log('Updating collaborator teams and position:', { teams, position });
        
        // Update teams if provided
        if (teams && Array.isArray(teams)) {
          await updateCollaboratorTeams(username, teams);
        }
        
        // Update position if provided
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
      // Even if roles aren't being updated, update collaborator info if user is already a collaborator
      const currentRoles = await getUserRoles(username);
      if (currentRoles.includes('collaborator') && (teams || position)) {
        console.log('Updating existing collaborator teams and position:', { teams, position });
        
        // Update teams if provided
        if (teams && Array.isArray(teams)) {
          await updateCollaboratorTeams(username, teams);
        }
        
        // Update position if provided
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