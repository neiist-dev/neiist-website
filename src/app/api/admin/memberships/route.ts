import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addTeamMember, removeTeamMember, getUser, getAllMemberships } from '@/utils/dbUtils';
import { UserRole, mapRoleToUserRole } from '@/types/user';

async function checkAdminPermission(): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get('accessToken')?.value;

  if (!accessToken) {
    return { isAuthorized: false, error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  try {
    const userData = JSON.parse((await cookies()).get('userData')?.value || 'null');
    if (!userData) {
      return { isAuthorized: false, error: NextResponse.json({ error: "User data not found" }, { status: 404 }) };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return { isAuthorized: false, error: NextResponse.json({ error: "Current user not found" }, { status: 404 }) };
    }

    const currentUserRoles = currentUser.roles?.map(role => mapRoleToUserRole(role)) || [UserRole.GUEST];
    const isAdmin = currentUserRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return { isAuthorized: false, error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
    }

    return { isAuthorized: true };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return { isAuthorized: false, error: NextResponse.json({ error: "Internal server error" }, { status: 500 }) };
  }
}

async function checkMembershipPermission(departmentName: string): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get('accessToken')?.value;

  if (!accessToken) {
    return { isAuthorized: false, error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  try {
    const userData = JSON.parse((await cookies()).get('userData')?.value || 'null');
    if (!userData) {
      return { isAuthorized: false, error: NextResponse.json({ error: "User data not found" }, { status: 404 }) };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return { isAuthorized: false, error: NextResponse.json({ error: "Current user not found" }, { status: 404 }) };
    }

    const currentUserRoles = currentUser.roles?.map(role => mapRoleToUserRole(role)) || [UserRole.GUEST];
    const isAdmin = currentUserRoles.includes(UserRole.ADMIN);
    const isCoordinator = currentUserRoles.includes(UserRole.COORDINATOR);

    if (isAdmin) {
      return { isAuthorized: true };
    }

    if (isCoordinator) {
      const userTeams = currentUser.teams || [];
      if (userTeams.includes(departmentName)) {
        return { isAuthorized: true }; // Coordinator can manage their own team
      }
    }
    return { isAuthorized: false, error: NextResponse.json({ error: "Insufficient permissions - Admin or team coordinator required" }, { status: 403 }) };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return { isAuthorized: false, error: NextResponse.json({ error: "Internal server error" }, { status: 500 }) };
  }
}

export async function GET() {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }

  try {
    const memberships = await getAllMemberships();
    const transformedMemberships = memberships.map((membership, index) => ({
      id: `${membership.user_istid}-${membership.department_name}-${membership.role_name}-${index}`,
      userNumber: membership.user_istid,
      userName: membership.user_name,
      userEmail: '',
      departmentName: membership.department_name,
      roleName: membership.role_name,
      startDate: membership.from_date,
      endDate: membership.to_date,
      isActive: membership.active
    }));

    return NextResponse.json(transformedMemberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await req.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const permissionCheck = await checkMembershipPermission(departmentName);
    if (!permissionCheck.isAuthorized) {
      return permissionCheck.error;
    }

    const success = await addTeamMember(istid, departmentName, roleName);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await req.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const permissionCheck = await checkMembershipPermission(departmentName);
    if (!permissionCheck.isAuthorized) {
      return permissionCheck.error;
    }

    const success = await removeTeamMember(istid, departmentName, roleName);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}
