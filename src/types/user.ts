import { devOverrideRole } from "@/utils/userUtils";

export interface User {
  istid: string;
  name: string;
  email: string;
  alternativeEmail?: string | null;
  alternativeEmailVerified: boolean;
  phone?: string | null;
  preferredContactMethod?: "email" | "alternativeEmail" | "phone";
  photo: string;
  courses: string[];
  roles: UserRole[];
  teams?: string[];
  github?: string;
  linkedin?: string;
}
interface dbUser {
  istid: string;
  name: string;
  email: string;
  alt_email?: string;
  phone?: string | null;
  preferred_contact_method?: "email" | "alternativeEmail" | "phone";
  photo_path?: string;
  courses?: string[];
  roles?: string[];
  teams?: string[];
  github?: string;
  linkedin?: string;
}

export enum UserRole {
  _ADMIN = "admin",
  _COORDINATOR = "coordinator",
  _MEMBER = "member",
  _GUEST = "guest",
}

export function mapRoleToUserRole(role: string): UserRole {
  switch (role.toLowerCase()) {
    case "member":
      return UserRole._MEMBER;
    case "coordinator":
      return UserRole._COORDINATOR;
    case "admin":
      return UserRole._ADMIN;
    default:
      return UserRole._GUEST;
  }
}

export function mapdbUserToUser(dbUser: dbUser): User {
  // If userRoles empty, user is guest.
  let userRoles: UserRole[];
  if (!dbUser.roles || dbUser.roles.length === 0) {
    userRoles = [UserRole._GUEST];
  } else {
    userRoles = dbUser.roles.map(mapRoleToUserRole);
  }
  // DEV permissions level override
  const devRole = devOverrideRole(dbUser.istid);
  if (devRole) {
    userRoles = [mapRoleToUserRole(devRole)];
  }
  return {
    istid: dbUser.istid,
    name: dbUser.name,
    email: dbUser.email,
    alternativeEmail: dbUser.alt_email ?? undefined,
    alternativeEmailVerified: true,
    phone: dbUser.phone ?? undefined,
    preferredContactMethod: dbUser.preferred_contact_method ?? undefined,
    photo: dbUser.photo_path ?? `/api/user/photo/${dbUser.istid}`,
    courses: dbUser.courses ?? [],
    roles: userRoles,
    teams: dbUser.teams ?? [],
    github: dbUser.github ?? undefined,
    linkedin: dbUser.linkedin ?? undefined,
  };
}

export function hasRequiredRole(userRoles: UserRole[], required: UserRole[]) {
  if (!required || required.length === 0) return true;
  return userRoles.some((role) => required.includes(role));
}

export function checkRoles(user: User | null | undefined, required: UserRole[]) {
  if (!required || required.length === 0) return true;
  const roles: UserRole[] = user?.roles?.map((r) => mapRoleToUserRole(r)) || [UserRole._GUEST];
  return hasRequiredRole(roles, required);
}
