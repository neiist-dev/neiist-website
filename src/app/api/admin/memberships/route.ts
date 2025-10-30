import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addTeamMember, removeTeamMember, getUser, getAllMemberships } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";
import { Membership } from "@/types/memberships";

async function checkMembershipPermission(
  departmentName: string
): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const isAdmin = currentUserRoles.includes(UserRole._ADMIN);
    const isCoordinator = currentUserRoles.includes(UserRole._COORDINATOR);

    if (isAdmin) {
      return { isAuthorized: true };
    }

    if (isCoordinator) {
      const userTeams = currentUser.teams || [];
      if (userTeams.includes(departmentName) || departmentName === "") {
        return { isAuthorized: true };
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
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
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
    console.error("Error fetching memberships:", error);
    return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await req.json();
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
  } catch {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { istid, departmentName, roleName } = await req.json();
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
  } catch {
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}
