import { devOverrideRole } from "@/utils/userUtils";
import { getDevOverridePermissions } from "@/lib/security/permissions";
import { Permission } from "@/types/permissions";
import { UserRole, mapRoleToUserRole, mapAccessLabelToUserRole } from "@/types/roles";

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
  permissions?: Permission[];
  departmentPermissions?: Record<string, Permission[]>;
  positionName?: string;
  teams?: string[];
  github?: string;
  linkedin?: string;
  isAnonymized?: boolean;
}
export interface dbUser {
  istid: string;
  name: string;
  email: string;
  alt_email?: string;
  phone?: string | null;
  preferred_contact_method?: "email" | "alternativeEmail" | "phone";
  photo_path?: string;
  courses?: string[];
  permissions?: Permission[];
  access_label?: "admin" | "coordinator" | null;
  department_permissions?: Record<string, Permission[]>;
  teams?: string[];
  github?: string;
  linkedin?: string;
}

function getDevOverrides(dbUser: dbUser, initialRoles: UserRole[]) {
  const devRole = devOverrideRole(dbUser.istid);
  if (!devRole) {
    return {
      roles: initialRoles,
      permissions: dbUser.permissions ?? [],
      departmentPermissions: dbUser.department_permissions ?? {},
    };
  }

  const roles = [mapRoleToUserRole(devRole)];
  let permissions = getDevOverridePermissions(devRole) ?? dbUser.permissions ?? [];
  let departmentPermissions = dbUser.department_permissions ?? {};

  if (devRole.toLowerCase() === "coordinator") {
    const coordPerms: Permission[] = ["memberships:write_dept", "photos:write_dept"];
    const overriddenDeptPerms = { ...departmentPermissions };
    for (const team of dbUser.teams ?? []) {
      overriddenDeptPerms[team] = Array.from(
        new Set([...(overriddenDeptPerms[team] ?? []), ...coordPerms])
      );
    }
    departmentPermissions = overriddenDeptPerms;
    permissions = permissions.filter((p) => !p.endsWith("_dept"));
  }

  return { roles, permissions, departmentPermissions };
}

export function mapdbUserToUser(dbUser: dbUser): User {
  const hasActiveMembership = (dbUser.teams ?? []).length > 0;
  const initialRoles = [mapAccessLabelToUserRole(dbUser.access_label, hasActiveMembership)];
  const { roles, permissions, departmentPermissions } = getDevOverrides(dbUser, initialRoles);

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
    roles,
    permissions,
    departmentPermissions,
    teams: dbUser.teams ?? [],
    github: dbUser.github ?? undefined,
    linkedin: dbUser.linkedin ?? undefined,
    isAnonymized: dbUser.email?.endsWith("@deleted.neiist.pt") ?? false,
  };
}
