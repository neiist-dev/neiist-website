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

export interface Member {
  istid: string;
  register_date: Date;
  elector_date: Date;
  start_renewal_date?: Date;
  end_renewal_date?: Date;
  renewal_notification: boolean;
}

export interface Collaborator {
  istid: string;
  teams: string[];
  position: string;
  from_date: Date;
  to_date: Date;
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
    status: dbPermissions.status
  };
}