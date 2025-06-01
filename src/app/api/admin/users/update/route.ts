import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser, createOrUpdateUser, addMember, addCollaborator, addAdmin, removeRole, getUserRoles,
        updateCollaboratorTeams, updateUserPhoto, updateMemberRoleFields, updateCollaboratorRoleFields 
       } from "@/utils/dbUtils";
import { UserData } from "@/types/user";
import { apiError, isAdmin } from "@/utils/permissionsUtils";

export async function PUT(request: Request) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  const userData = (await cookies()).get('userData')?.value;

  if (!accessToken || !userData) {
    return NextResponse.json(apiError("Not authenticated", 401), { status: 401 });
  }

  const parsedUserData: UserData = JSON.parse(userData);
  if (!isAdmin(parsedUserData)) {
    return NextResponse.json(apiError("Insufficient permissions", 403), { status: 403 });
  }

  try {
    const updateData = await request.json();
    const {
      username,
      roles: newRoles,
      teams,
      position,
      registerDate,
      electorDate,
      fromDate,
      toDate,
      startRenewalDate,
      endRenewalDate,
      renewalNotification,
      photo,
      ...otherUpdates
    } = updateData;

    if (!username) {
      return NextResponse.json(apiError("Username is required", 400), { status: 400 });
    }

    const existingUser = await getUser(username);
    if (!existingUser) {
      return NextResponse.json(apiError("User not found", 404), { status: 404 });
    }

    if (photo && photo !== existingUser.photoData) {
      await updateUserPhoto(username, photo);
    }

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
          break;
      }
    });

    if (Object.keys(mappedUpdates).length > 0) {
      await createOrUpdateUser({
        istid: username,
        ...mappedUpdates
      });
    }

    if (newRoles && Array.isArray(newRoles)) {
      const currentRoleDetails = await getUserRoles(username);
      const currentRoles = currentRoleDetails.roles;
      const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
      const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

      for (const role of rolesToRemove) {
        await removeRole(username, role);
      }

      for (const role of rolesToAdd) {
        switch (role) {
          case 'member':
            await addMember(
              username,
              registerDate ? new Date(registerDate) : undefined,
              electorDate ? new Date(electorDate) : undefined
            );
            break;
          case 'collaborator':
            await addCollaborator(
              username,
              teams || [],
              position || 'Collaborator',
              fromDate ? new Date(fromDate) : new Date(),
              toDate ? new Date(toDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            );
            break;
          case 'admin':
            await addAdmin(username);
            break;
        }
      }

      if (newRoles.includes('member') && (registerDate || electorDate || startRenewalDate || endRenewalDate || typeof renewalNotification !== 'undefined')) {
        await updateMemberRoleFields(username, {
          registerDate: registerDate ? new Date(registerDate) : undefined,
          electorDate: electorDate ? new Date(electorDate) : undefined,
          startRenewalDate: startRenewalDate ? new Date(startRenewalDate) : undefined,
          endRenewalDate: endRenewalDate ? new Date(endRenewalDate) : undefined,
          renewalNotification
        });
      }

      if (newRoles.includes('collaborator') && (teams || position || fromDate || toDate)) {
        await updateCollaboratorRoleFields(username, {
          teams,
          position,
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate: toDate ? new Date(toDate) : undefined
        });
      }
    } else {
      const currentRoleDetails = await getUserRoles(username);
      if (currentRoleDetails.roles.includes('collaborator') && teams && Array.isArray(teams)) {
        await updateCollaboratorTeams(username, teams.filter(t => t && t.trim() !== ""));
      }
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(apiError("Internal server error", 500, error instanceof Error ? error.message : 'Unknown error'), { status: 500 });
  }
}
