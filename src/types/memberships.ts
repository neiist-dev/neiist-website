export interface Description {
  pt: string;
  en: string;
}

export interface Team {
  name: string;
  description: Description;
  icon: string;
  active?: boolean;
  displayOrder?: number;
}

export interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  departmentType?: "team" | "admin_body";
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
  userPhoto: string;
  isAnonymized?: boolean;
  github?: string;
  linkedin?: string;
}

export interface dbMembership {
  user_istid: string;
  user_name: string;
  user_email?: string;
  user_photo?: string;
  user_github?: string;
  user_linkedin?: string;
  department_name: string;
  department_type?: string;
  role_name: string;
  from_date: string | Date;
  to_date: string | Date | null;
  active: boolean;
}

/**
 * Normalizes a Date or string value to a standard ISO date string ('YYYY-MM-DD').
 */
const toDate = (val?: Date | string | null): string =>
  val instanceof Date ? val.toISOString().slice(0, 10) : (val?.slice(0, 10) ?? "");

export function mapdbMembershipToMembership(raw: dbMembership): Membership {
  const startDate = toDate(raw.from_date);
  const endDate = raw.to_date ? toDate(raw.to_date) : undefined;

  const email = raw.user_email || "";
  const photo = raw.user_photo || (raw.user_istid ? `/api/user/photo/${raw.user_istid}` : "");

  return {
    id: `${raw.user_istid}-${raw.department_name}-${raw.role_name}-${startDate}`,
    userNumber: raw.user_istid,
    userName: raw.user_name,
    departmentName: raw.department_name,
    departmentType: raw.department_type === "admin_body" ? "admin_body" : "team",
    roleName: raw.role_name,
    startDate,
    endDate,
    isActive: raw.active,
    userEmail: email,
    userPhoto: photo,
    isAnonymized: email.endsWith("@deleted.neiist.pt"),
    github: raw.user_github,
    linkedin: raw.user_linkedin,
  };
}
