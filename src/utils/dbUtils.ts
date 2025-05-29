import { db_query, storePhotoLO, getPhotoByOID, deletePhotoLO  } from '@/lib/db';
import { User } from '@/types/user';

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
        return { ...rows[0], photoData: photo };
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
      // Update existing user
      const updateFields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;
      
      // Build dynamic query based on provided fields
      Object.entries(user).forEach(([key, value]) => {
        if (key !== 'istid' && key !== 'photoData' && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
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
    const { rows } = await db_query(
      'SELECT 1 FROM neiist.roles WHERE istid = $1 AND role_type = $2',
      [istid, 'admin']
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getUserRoles = async (istid: string): Promise<string[]> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const { rows } = await db_query<{ role_type: string }>(
      `SELECT role_type FROM neiist.roles 
       WHERE istid = $1 
       AND (role_type != 'collaborator' OR $2 BETWEEN from_date AND to_date)`,
      [istid, currentDate]
    );
    return rows.map(row => row.role_type);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
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

export const addAdmin = async (istid: string): Promise<boolean> => {
  try {
    await db_query(
      `INSERT INTO neiist.roles (istid, role_type) 
       VALUES ($1, 'admin')
       ON CONFLICT (istid, role_type) DO NOTHING`,
      [istid]
    );
    return true;
  } catch (error) {
    console.error('Error adding admin:', error);
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
      return false;
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
