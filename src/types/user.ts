export interface User {
  istid: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  phone?: string;
  preferredContactMethod?: 'email' | 'alternativeEmail' | 'phone';
  photo: string;
  courses: string[];
  roles: UserRole[];
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
