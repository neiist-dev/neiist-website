"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  addMembership,
  concludeMembership,
  deleteMembership,
  getMembershipsForAcademicYear,
  getUserMemberships,
} from "@/lib/db/repositories/team.repository";
import { getUser } from "@/lib/db/repositories/user.repository";
import type { Membership } from "@/types/memberships";
import type { UserProfile } from "@/types/user";

export async function getYearMembershipsAction(year: string) {
  await requirePermission("memberships:read");
  return getMembershipsForAcademicYear(year);
}

export async function addMembershipAction(params: {
  userNumber: string;
  departmentName: string;
  roleName: string;
  fromDate?: string;
  toDate?: string;
}) {
  await requirePermission(["memberships:write_global", "memberships:write_dept"], {
    department: params.departmentName,
    match: "any",
  });

  const success = await addMembership(
    params.userNumber,
    params.departmentName,
    params.roleName,
    params.fromDate,
    params.toDate
  );
  if (!success) throw new Error("Failed to add membership");

  revalidateTag("memberships", "max");
  revalidateTag("academic_years", "max");
  revalidateTag("users", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function concludeMembershipAction(params: {
  membershipId?: string;
  userNumber?: string;
  departmentName?: string;
  roleName?: string;
  fromDate?: string;
}) {
  let userNumber = params.userNumber;
  let departmentName = params.departmentName;
  let roleName = params.roleName;
  let fromDate = params.fromDate;

  if ((!userNumber || !departmentName || !roleName || !fromDate) && params.membershipId) {
    const parts = params.membershipId.split("-");
    if (parts.length >= 4) {
      userNumber = parts[0];
      fromDate = parts.slice(-3).join("-");
      departmentName = parts[1];
      roleName = parts.slice(2, -3).join("-");
    }
  }

  if (!userNumber || !departmentName || !roleName || !fromDate)
    throw new Error("Missing membership details to conclude");

  await requirePermission(["memberships:write_global", "memberships:write_dept"], {
    department: departmentName,
    match: "any",
  });

  const success = await concludeMembership(userNumber, departmentName, roleName, fromDate);
  if (!success) throw new Error("Failed to conclude membership");

  revalidateTag("memberships", "max");
  revalidateTag("users", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function deleteMembershipAction(params: {
  membershipId?: string;
  userNumber?: string;
  departmentName?: string;
  roleName?: string;
  fromDate?: string;
}) {
  let userNumber = params.userNumber;
  let departmentName = params.departmentName;
  let roleName = params.roleName;
  let fromDate = params.fromDate;

  if ((!userNumber || !departmentName || !roleName || !fromDate) && params.membershipId) {
    const parts = params.membershipId.split("-");
    if (parts.length >= 4) {
      userNumber = parts[0];
      fromDate = parts.slice(-3).join("-");
      departmentName = parts[1];
      roleName = parts.slice(2, -3).join("-");
    }
  }

  if (!userNumber || !departmentName || !roleName || !fromDate)
    throw new Error("Missing membership details to delete");

  await requirePermission("memberships:delete", {
    department: departmentName,
  });

  const success = await deleteMembership(userNumber, departmentName, roleName, fromDate);
  if (!success) throw new Error("Failed to delete membership");

  revalidateTag("memberships", "max");
  revalidateTag("academic_years", "max");
  revalidateTag("users", "max");
  revalidatePath("/about-us");
  revalidatePath("/management");
  return { success: true };
}

export async function getMemberHistoryAction(istid: string): Promise<{
  user: UserProfile | null;
  memberships: Membership[];
}> {
  await requirePermission(
    ["memberships:read", "memberships:write_dept", "memberships:write_global"],
    {
      match: "any",
    }
  );

  const [fullUser, memberships] = await Promise.all([
    getUser(istid),
    getUserMemberships(istid, false),
  ]);

  const user: UserProfile | null = fullUser
    ? {
        istid: fullUser.istid,
        name: fullUser.name,
        email: fullUser.email,
        alternativeEmail: fullUser.alternativeEmail,
        neiistEmail: fullUser.neiistEmail,
        phone: fullUser.phone,
        courses: fullUser.courses,
        photo: fullUser.photo,
      }
    : null;

  return { user, memberships };
}
