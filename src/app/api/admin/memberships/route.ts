import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import type { Membership } from "@/types/memberships";
import { handleApiError } from "@/utils/apiErrorUtils";
import { addTeamMember, removeTeamMember, getAllMemberships } from "@/utils/db/userQueries";
import { serverCheckRoles } from "@/lib/auth";

async function checkMembershipPermission(departmentName: string) {
  const roles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!roles.isAuthorized) return roles;

  const isAdmin = roles.roles?.includes(UserRole._ADMIN);
  const isCoordinator = roles.roles?.includes(UserRole._COORDINATOR);
  if (isAdmin) return roles;

  if (isCoordinator) {
    const userTeams = roles.user?.teams || [];
    if (userTeams.includes(departmentName) || departmentName === "") {
      return roles;
    }
  }

  return {
    isAuthorized: false,
    error: NextResponse.json(
      {
        error: "Insufficient permissions - Admin or team coordinator required",
      },
      { status: 403 }
    ),
  } as const;
}

export async function GET() {
  const permissionCheck = await checkMembershipPermission("");
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }

  try {
    const memberships: Membership[] = await getAllMemberships();
    return NextResponse.json(memberships);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await request.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const permissionCheck = await checkMembershipPermission(departmentName);
    if (!permissionCheck.isAuthorized) {
      return permissionCheck.error;
    }

    const success = await addTeamMember(istid, departmentName, roleName);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await request.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const permissionCheck = await checkMembershipPermission(departmentName);
    if (!permissionCheck.isAuthorized) {
      return permissionCheck.error;
    }

    const success = await removeTeamMember(istid, departmentName, roleName);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
