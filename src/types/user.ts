export interface User {
  istid: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  alternativeEmailVerified: boolean;
  phone?: string;
  preferredContactMethod?: 'email' | 'alternativeEmail' | 'phone';
  photo?: string;
  courses: string[];
  roles: UserRole[];
  teams?: string[];
}
interface DbUser {
  istid: string;
  name: string;
  email: string;
  alternative_email?: string;
  phone?: string;
  preferred_contact_method?: 'email' | 'alternativeEmail' | 'phone';
  photo_path?: string;
  courses?: string[];
  roles?: string[];
  teams?: string[];
}

export function getFirstAndLastName(user: User): string {
  const parts = user.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export enum UserRole {
  GUEST = 'guest',
  MEMBER = 'member',
  COORDINATOR = 'coordinator',
  ADMIN = 'admin',
}

export function mapRoleToUserRole(role: string): UserRole {
  switch (role.toLowerCase()) {
    case 'member':
      return UserRole.MEMBER;
    case 'coordinator':
      return UserRole.COORDINATOR;
    case 'admin':
      return UserRole.ADMIN;
    default:
      return UserRole.GUEST;
  }
}

export function mapDbUserToUser(dbUser: DbUser): User {
  // If userRoles empty it is guest
  let userRoles: UserRole[];
  if (!dbUser.roles || dbUser.roles.length === 0) {
    userRoles = [UserRole.GUEST];
  } else {
    userRoles = dbUser.roles.map(mapRoleToUserRole);
  }

  return {
    istid: dbUser.istid,
    name: dbUser.name,
    email: dbUser.email,
    alternativeEmail: dbUser.alternative_email ?? undefined,
    alternativeEmailVerified: true,
    phone: dbUser.phone ?? undefined,
    preferredContactMethod: dbUser.preferred_contact_method ?? undefined,
    photo: dbUser.photo_path ?? `/api/user/photo/${dbUser.istid}`,
    courses: dbUser.courses ?? [],
    roles: userRoles,
    teams: dbUser.teams ?? [],
  };
}
