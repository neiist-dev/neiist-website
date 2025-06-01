export interface User {
  istid: string;
  name: string;
  email: string;
  phone?: string;
  courses?: string[];
  campus?: string;
  photo?: string | number; // OID in DB, string when retrieved
  photoData?: string; // Base64 photo data when retrieved from LO
}

export interface UserRoleDetails {
  roles: string[];
  teams: string[];
  position?: string;
  registerDate?: string;
  electorDate?: string;
  fromDate?: string;
  toDate?: string;
  startRenewalDate?: string;
  endRenewalDate?: string;
  renewalNotification?: boolean;
}

export interface TeamRole {
  value: string;
  label: string;
  isCoordinator: boolean;
}

export interface UserData {
  username: string;
  displayName: string;
  email?: string;
  courses?: string[];
  campus?: string;
  isActiveTecnicoStudent?: boolean;
  isAdmin?: boolean;
  isCollab?: boolean;
  isActiveLMeicStudent?: boolean;
  isGacMember?: boolean;
  photo: string;
  status: string;
  roles?: string[];
  teams?: string[];
  position?: string;
  registerDate?: string;
  electorDate?: string;
  fromDate?: string;
  toDate?: string;
  startRenewalDate?: string;
  endRenewalDate?: string;
  renewalNotification?: boolean;
}

export function mapUserToUserData(
  user: User,
  dbPermissions: {
    isActiveTecnicoStudent?: boolean;
    isActiveLMeicStudent?: boolean;
    isCollab?: boolean;
    isAdmin?: boolean;
    isGacMember?: boolean;
    status: string;
    fenixPhoto?: string;
    // Add role details
    roles?: string[];
    teams?: string[];
    position?: string;
    registerDate?: string;
    electorDate?: string;
    fromDate?: string;
    toDate?: string;
    startRenewalDate?: string;
    endRenewalDate?: string;
    renewalNotification?: boolean;
  }
): UserData {
  return {
    username: user.istid,
    displayName: user.name,
    email: user.email,
    courses: user.courses || [],
    campus: user.campus || 'Unknown',
    photo: user.photoData || dbPermissions.fenixPhoto || '/default_user.png',
    isActiveTecnicoStudent: dbPermissions.isActiveTecnicoStudent || false,
    isActiveLMeicStudent: dbPermissions.isActiveLMeicStudent || false,
    isCollab: dbPermissions.isCollab || false,
    isAdmin: dbPermissions.isAdmin || false,
    isGacMember: dbPermissions.isGacMember || false,
    status: dbPermissions.status,
    roles: dbPermissions.roles || [],
    teams: dbPermissions.teams || [],
    position: dbPermissions.position,
    registerDate: dbPermissions.registerDate,
    electorDate: dbPermissions.electorDate,
    fromDate: dbPermissions.fromDate,
    toDate: dbPermissions.toDate,
    startRenewalDate: dbPermissions.startRenewalDate,
    endRenewalDate: dbPermissions.endRenewalDate,
    renewalNotification: dbPermissions.renewalNotification
  };
}
