import { User, UserRoleDetails, UserData, mapUserToUserData } from "@/types/user";

export function hasRole(user: UserData, allowed: string[]): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return allowed.includes(user.status);
}

export function isAdmin(user: UserData): boolean {
  return !!user?.isAdmin;
}

export function apiError(message: string, status = 500, details?: string) {
  return { error: message, status, ...(details ? { details } : {}) };
}

export function mapDbUserAndRolesToUserData(
  user: User,
  roleDetails: UserRoleDetails
): UserData {
  let status = 'Regular';
  if (roleDetails.roles.includes('admin')) status = 'Admin';
  else if (roleDetails.roles.includes('collaborator')) status = 'Collaborator';
  else if (roleDetails.roles.includes('member')) status = 'Member';

  return mapUserToUserData(user, {
    status,
    ...roleDetails
  });
}
