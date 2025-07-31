export interface RawMembership {
  user_istid: string;
  user_name: string;
  department_name: string;
  role_name: string;
  from_date: string;
  to_date: string | null;
  active: boolean;
}

export interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
  userPhoto: string;
}

export interface Role {
  roleName: string;
  access: "guest" | "member" | "coordinator" | "admin";
}

/**
 * Maps a RawMembership and user info to a Membership.
 * @param raw RawMembership from DB
 * @param userEmail Email of the user (optional)
 * @param userPhoto Photo URL of the user (optional)
 * @param idx Optional index for unique ID
 */
export function mapRawMembershipToMembership(
  raw: RawMembership,
  userEmail = "",
  userPhoto = "",
  idx = 0
): Membership {
  return {
    id: `${raw.user_istid}-${raw.department_name}-${raw.role_name}-${idx}`,
    userNumber: raw.user_istid,
    userName: raw.user_name,
    departmentName: raw.department_name,
    roleName: raw.role_name,
    startDate: raw.from_date,
    endDate: raw.to_date ?? undefined,
    isActive: raw.active,
    userEmail,
    userPhoto,
  };
}
