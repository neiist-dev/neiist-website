import { db_query } from '@/lib/db';
import { storePhotoLo, getPhotoByOid, deletePhotoLo } from '@/lib/dbLo';
import { User } from '@/types/user';

export const getUser = async (istid: string): Promise<User | null> => {
  try {
    const { rows } = await db_query<User>(
      'SELECT istid, name, email, phone, courses, campus, permission, photo FROM public.users WHERE istid = $1',
      [istid]
    );
    
    if (!rows[0]) return null;
    
    // If there's a photo OID, fetch the actual photo data
    if (rows[0].photo) {
      const photo = await getPhotoByOid(Number(rows[0].photo));
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
        if (key !== 'istid' && value !== undefined) {
          // Special handling for courses array
          if (key === 'courses' && Array.isArray(value)) {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(value); // PostgreSQL handles array types directly
            paramIndex++;
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
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
      const fields = Object.keys(user);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values: unknown[] = Object.values(user);
      
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
      'SELECT * FROM members.members WHERE istid = $1',
      [istid]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking member status:', error);
    return false;
  }
};

export const checkIsCollaborator = async (istid: string): Promise<boolean> => {
  try {
    const currentDate = new Date();
    const { rows } = await db_query(
      'SELECT * FROM neilist.collaborators WHERE istid = $1 AND $2 BETWEEN fromDate AND toDate',
      [istid, currentDate]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking collaborator status:', error);
    return false;
  }
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  try {
    // First, check if the user already has a photo
    const user = await getUser(istid);
    
    if (user && user.photo) {
      // If user already has a photo, delete the old Large Object
      await deletePhotoLo(Number(user.photo));
    }
    
    // Store the new photo as a Large Object
    const newOid = await storePhotoLo(photoData);
    
    if (!newOid) {
      return false;
    }
    
    // Update the user's photo reference
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
