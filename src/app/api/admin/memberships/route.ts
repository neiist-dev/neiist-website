import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import type { Membership } from "@/types/memberships";
import { handleApiError } from "@/utils/apiErrorUtils";
import {
  addTeamMember,
  removeTeamMember,
  getAllMemberships,
  getDepartmentRoles,
} from "@/lib/db/repositories/team.repository";
import { serverCheckRoles } from "@/lib/auth";
import { canManageDepartment, canAssignRoleAccess } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";

export async function GET() {
  const auth = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!auth.isAuthorized) return auth.error;

  try {
    const memberships: Membership[] = await getAllMemberships();
    return NextResponse.json(memberships);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!auth.isAuthorized) return auth.error;

  try {
    const { istid, departmentName, roleName } = await request.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const canManage = await canManageDepartment(auth.roles, auth.user?.istid, departmentName);
    if (!canManage) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage memberships in this department" },
        { status: 403 }
      );
    }

    const deptRoles = await getDepartmentRoles(departmentName);
    const targetRole = deptRoles.find(
      (r) => r.role_name.toLowerCase() === String(roleName).toLowerCase()
    );
    if (targetRole && !canAssignRoleAccess(auth.roles, targetRole.access)) {
      return NextResponse.json(
        { error: "Insufficient permissions to assign this role access level" },
        { status: 403 }
      );
    }

    const success = await addTeamMember(istid, departmentName, roleName);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/team-management");
      revalidatePath("/photo-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!auth.isAuthorized) return auth.error;

  try {
    const { istid, departmentName, roleName } = await request.json();
    if (!istid || !departmentName || !roleName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const canManage = await canManageDepartment(auth.roles, auth.user?.istid, departmentName);
    if (!canManage) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage memberships in this department" },
        { status: 403 }
      );
    }

    const success = await removeTeamMember(istid, departmentName, roleName);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/team-management");
      revalidatePath("/photo-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
