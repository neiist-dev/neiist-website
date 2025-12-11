export interface Team {
  name: string;
  description: string;
  icon: string;
}

export interface Role {
  roleName: string;
  access: "guest" | "shop_manager" | "member" | "coordinator" | "admin";
}

export interface dbRole {
  roleName?: string;
  role_name?: string;
  access: string;
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

export interface dbMembership {
  user_istid: string;
  user_name: string;
  department_name: string;
  role_name: string;
  from_date: string;
  to_date: string | null;
  active: boolean;
}

export function mapdbMembershipToMembership(
  raw: dbMembership,
  userEmail = "",
  userPhoto = "",
  index = 0
): Membership {
  return {
    id: `${raw.user_istid}-${raw.department_name}-${raw.role_name}-${index}`,
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
