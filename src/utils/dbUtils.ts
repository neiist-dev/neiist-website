import { db_query, storePhotoLO, getPhotoByOID, deletePhotoLO  } from '@/lib/db';
import { User, UserRoleDetails, TeamRole } from '@/types/user';

export const getUser = async (istid: string): Promise<User | null> => {
  try {
    const { rows } = await db_query<User>(
      'SELECT istid, name, email, phone, courses, campus, photo FROM public.users WHERE istid = $1',
      [istid]
    );

    if (!rows[0]) return null;

    // If there's a photo OID, fetch the actual photo data
    if (rows[0].photo) {
      const photo = await getPhotoByOID(Number(rows[0].photo));
      if (photo) {
        rows[0].photoData = photo;
      }
    }
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const createOrUpdateUser = async (user: Partial<User>): Promise<User | null> => {
  try {
    // Check if user already exists
    const existingUser = user.istid ? await getUser(user.istid) : null;

    if (existingUser) {
      const updateFields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      // Build dynamic query based on provided fields
      Object.entries(user).forEach(([key, value]) => {
        if (key !== 'istid' && key !== 'photoData' && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      });

      values.push(user.istid);

      if (updateFields.length > 0) {
        await db_query(
          `UPDATE public.users SET ${updateFields.join(', ')} WHERE istid = $${paramIndex}`,
          values
        );
      }
      return await getUser(user.istid!);

    } else if (user.istid && user.name && user.email) {
      // Create new user
      const fields = Object.keys(user).filter(key => key !== 'photoData');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values: unknown[] = fields.map(field => user[field as keyof User]);

      await db_query(
        `INSERT INTO public.users (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );

      return await getUser(user.istid);
    }

    return null;
  } catch (error) {
    console.error('Error creating or updating user:', error);
    return null;
  }
};

export const checkIsMember = async (istid: string): Promise<boolean> => {
  try {
    const { rows } = await db_query(
      'SELECT 1 FROM neiist.roles WHERE istid = $1 AND role_type = $2',
      [istid, 'member']
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking member status:', error);
    return false;
  }
};

export const checkIsCollaborator = async (istid: string): Promise<boolean> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { rows } = await db_query(
      'SELECT 1 FROM neiist.roles WHERE istid = $1 AND role_type = $2 AND $3 BETWEEN from_date AND to_date',
      [istid, 'collaborator', currentDate]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking collaborator status:', error);
    return false;
  }
};

export const checkIsAdmin = async (istid: string): Promise<boolean> => {
  try {
    const { rows } = await db_query<{ is_admin: boolean }>(
      'SELECT neiist.is_admin($1) as is_admin',
      [istid]
    );
    return rows[0]?.is_admin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const addAdmin = async (istid: string): Promise<boolean> => {
  try {
    const { rows } = await db_query<{ add_admin_user: boolean }>(
      'SELECT neiist.add_admin_user($1) as add_admin_user',
      [istid]
    );
    return rows[0]?.add_admin_user || false;
  } catch (error) {
    console.error('Error adding admin user:', error);
    return false;
  }
};

export const removeAdminUser = async (istid: string): Promise<boolean> => {
  try {
    const { rows } = await db_query<{ remove_admin_user: boolean }>(
      'SELECT neiist.remove_admin_user($1) as remove_admin_user',
      [istid]
    );
    return rows[0]?.remove_admin_user || false;
  } catch (error) {
    console.error('Error removing admin user:', error);
    return false;
  }
};

export const getAdminUsers = async (): Promise<User[]> => {
  try {
    const { rows } = await db_query<User>(
      `SELECT istid, name, email, phone, courses, campus, photo FROM neiist.get_admin_users()`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};

export const getTeamRoles = async (): Promise<TeamRole[]> => {
  try {
    const { rows } = await db_query<{
      value: string;
      label: string;
      is_coordinator: boolean;
    }>(
      `SELECT value, label, is_coordinator FROM neiist.get_team_roles_formatted()`
    );
    return rows.map(row => ({
      value: row.value,
      label: row.label,
      isCoordinator: row.is_coordinator,
    }));
  } catch (error) {
    console.error('Error fetching team roles:', error);
    return [];
  }
};

export const getUserRoles = async (istid: string): Promise<UserRoleDetails> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];

    const rolesQuery = await db_query<{ role_type: string }>(
      `SELECT role_type FROM neiist.roles 
       WHERE istid = $1 
       AND (role_type != 'collaborator' OR $2 BETWEEN from_date AND to_date)`,
      [istid, currentDate]);

    const roles = rolesQuery.rows.map(row => row.role_type);
    
    if (roles.length === 0) {
      return {
        roles: [],
        teams: [],
        position: undefined,
        registerDate: undefined,
        electorDate: undefined,
        fromDate: undefined,
        toDate: undefined,
        startRenewalDate: undefined,
        endRenewalDate: undefined,
        renewalNotification: undefined
      };
    }

    const roleDetailsQuery = await db_query(`
      SELECT role_type, teams, position, register_date, elector_date, from_date, to_date,
             start_renewal_date, end_renewal_date, renewal_notification 
      FROM neiist.roles 
      WHERE istid = $1`,
      [istid]);

    const memberInfo = roleDetailsQuery.rows.find(r => r.role_type === 'member');
    const collabInfo = roleDetailsQuery.rows.find(r => r.role_type === 'collaborator');

    let teams: string[] = [];
    if (collabInfo?.teams) {
      if (Array.isArray(collabInfo.teams)) {
        teams = collabInfo.teams;
      } else if (typeof collabInfo.teams === 'string') {
        teams = collabInfo.teams.startsWith('{') && collabInfo.teams.endsWith('}')
          ? collabInfo.teams.slice(1, -1).split(',')
          : [collabInfo.teams];
      }
    }

    return {
      roles,
      teams,
      position: collabInfo?.position,
      registerDate: memberInfo?.register_date,
      electorDate: memberInfo?.elector_date,
      fromDate: collabInfo?.from_date,
      toDate: collabInfo?.to_date,
      startRenewalDate: memberInfo?.start_renewal_date,
      endRenewalDate: memberInfo?.end_renewal_date,
      renewalNotification: memberInfo?.renewal_notification
    };
  } catch (error) {
    console.error('Error fetching user role details:', error);
    return {
      roles: [],
      teams: [],
      position: undefined,
      registerDate: undefined,
      electorDate: undefined,
      fromDate: undefined,
      toDate: undefined,
      startRenewalDate: undefined,
      endRenewalDate: undefined,
      renewalNotification: undefined
    };
  }
};

export const addMember = async (istid: string, registerDate?: Date, electorDate?: Date): Promise<boolean> => {
  try {
    await db_query(
      `INSERT INTO neiist.roles (istid, role_type, register_date, elector_date) 
       VALUES ($1, 'member', $2, $3)
       ON CONFLICT (istid, role_type) DO NOTHING`,
      [istid, registerDate || new Date(), electorDate || new Date()]
    );
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    return false;
  }
};

export const addCollaborator = async (istid: string, teams: string[], position: string, fromDate: Date, toDate: Date): Promise<boolean> => {
  try {
    await db_query(
      `INSERT INTO neiist.roles (istid, role_type, teams, position, from_date, to_date) 
       VALUES ($1, 'collaborator', $2::neiist.team_role_enum[], $3, $4, $5)
       ON CONFLICT (istid, role_type) DO UPDATE SET 
       teams = $2::neiist.team_role_enum[], position = $3, from_date = $4, to_date = $5`,
      [istid, teams, position, fromDate, toDate]
    );
    return true;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return false;
  }
};

export const updateMemberRoleFields = async ( istid: string, fields: { registerDate?: Date; electorDate?: Date; startRenewalDate?: Date; endRenewalDate?: Date; renewalNotification?: boolean; }): Promise<boolean> => {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (fields.registerDate) {
      updates.push(`register_date = $${paramIndex++}`);
      values.push(fields.registerDate);
    }
    if (fields.electorDate) {
      updates.push(`elector_date = $${paramIndex++}`);
      values.push(fields.electorDate);
    }
    if (fields.startRenewalDate) {
      updates.push(`start_renewal_date = $${paramIndex++}`);
      values.push(fields.startRenewalDate);
    }
    if (fields.endRenewalDate) {
      updates.push(`end_renewal_date = $${paramIndex++}`);
      values.push(fields.endRenewalDate);
    }
    if (typeof fields.renewalNotification !== 'undefined') {
      updates.push(`renewal_notification = $${paramIndex++}`);
      values.push(fields.renewalNotification);
    }

    if (updates.length === 0) return true;

    values.push(istid);
    await db_query(
      `UPDATE neiist.roles SET ${updates.join(', ')} WHERE istid = $${paramIndex} AND role_type = 'member'`,
      values
    );
    return true;
  } catch (error) {
    console.error('Error updating member role fields:', error);
    return false;
  }
};

export const updateCollaboratorRoleFields = async (istid: string, fields: {teams?: string[]; position?: string; fromDate?: Date; toDate?: Date;}): Promise<boolean> => {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (fields.teams && Array.isArray(fields.teams)) {
      updates.push(`teams = $${paramIndex++}::neiist.team_role_enum[]`);
      values.push(fields.teams.filter(t => t && t.trim() !== ""));
    }
    if (fields.position) {
      updates.push(`position = $${paramIndex++}`);
      values.push(fields.position);
    }
    if (fields.fromDate) {
      updates.push(`from_date = $${paramIndex++}`);
      values.push(fields.fromDate);
    }
    if (fields.toDate) {
      updates.push(`to_date = $${paramIndex++}`);
      values.push(fields.toDate);
    }

    if (updates.length === 0) return true;

    values.push(istid);
    await db_query(
      `UPDATE neiist.roles SET ${updates.join(', ')} WHERE istid = $${paramIndex} AND role_type = 'collaborator'`,
      values
    );
    return true;
  } catch (error) {
    console.error('Error updating collaborator role fields:', error);
    return false;
  }
};

export const removeRole = async (istid: string, roleType: string): Promise<boolean> => {
  try {
    await db_query(
      'DELETE FROM neiist.roles WHERE istid = $1 AND role_type = $2',
      [istid, roleType]
    );
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
};

export const updateCollaboratorTeams = async (istid: string, teams: string[]): Promise<boolean> => {
  try {
    await db_query(
      `UPDATE neiist.roles 
       SET teams = $1::neiist.team_role_enum[]
       WHERE istid = $2 AND role_type = 'collaborator'`,
      [teams, istid]
    );
    return true;
  } catch (error) {
    console.error('Error updating collaborator teams:', error);
    return false;
  }
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  try {
    // First, check if the user already has a photo
    const user = await getUser(istid);
    if (user && user.photo) {
      // If user already has a photo, delete the old Large Object
      await deletePhotoLO(Number(user.photo));
    }
    // Store the new photo as a Large Object
    const newOid = await storePhotoLO(photoData);
    if (!newOid) {
      throw new Error('Failed to store photo');
    }

    await db_query(
      'UPDATE public.users SET photo = $1 WHERE istid = $2',
      [newOid, istid]
    );

    return true;
  } catch (error) {
    console.error('Error updating user photo:', error);
    return false;
  }
};
