import type { MembershipParams, ParsedMembershipId } from "@/types/memberships";

/**
 * Decode `membershipId` in the followed format: userNumber-departmentName-roleName-YYYY-MM-DD
 */
export function decodeMembershipId(membershipId: string): ParsedMembershipId | null {
  const parts = membershipId.split("-");

  if (parts.length < 6) return null;

  const userNumber = parts[0];
  const fromDate = parts.slice(-3).join("-");
  const departmentName = parts[1];
  const roleName = parts.slice(2, -3).join("-");

  if (!userNumber || !departmentName || !roleName || !fromDate) {
    return null;
  }

  return { userNumber, departmentName, roleName, fromDate };
}

/**
 * Resolve the membership parameters from the explicitly provided values 
 * or by falling back to the `membershipId`.
 */
export function resolveMembershipParams(params: MembershipParams): ParsedMembershipId | null {
  let { userNumber, departmentName, roleName, fromDate } = params;

  if ((!userNumber || !departmentName || !roleName || !fromDate) && params.membershipId) {
    const decoded = decodeMembershipId(params.membershipId);
    if (decoded) {
      userNumber = userNumber || decoded.userNumber;
      departmentName = departmentName || decoded.departmentName;
      roleName = roleName || decoded.roleName;
      fromDate = fromDate || decoded.fromDate;
    }
  }

  if (!userNumber || !departmentName || !roleName || !fromDate) {
    return null;
  }

  return { userNumber, departmentName, roleName, fromDate };
}