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
}
interface DbUser {
  istid: string;
  name: string;
  email: string;
  alt_email?: string;
  phone?: string;
  preferred_contact_method?: "email" | "alternativeEmail" | "phone";
  photo_path?: string;
  courses?: string[];
  roles?: string[];
  teams?: string[];
}

export enum UserRole {
  _GUEST = "guest",
  _MEMBER = "member",
  _COORDINATOR = "coordinator",
  _ADMIN = "admin",
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

export function mapDbUserToUser(dbUser: DbUser): User {
  // If userRoles empty it is guest
  let userRoles: UserRole[];
  if (!dbUser.roles || dbUser.roles.length === 0) {
    userRoles = [UserRole._GUEST];
  } else {
    userRoles = dbUser.roles.map(mapRoleToUserRole);
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
  };
}
