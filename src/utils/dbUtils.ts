import { Pool, QueryResult, QueryResultRow } from 'pg';
import { User, mapRoleToUserRole } from '@/types/user';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db_query = async <T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const createUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.istid || !user.name || !user.email) return null;
  try {
    const { rows: [newUser] } = await db_query<User>(
      `SELECT * FROM neiist.add_user($1::VARCHAR(10), $2::TEXT, $3::TEXT, $4::TEXT, $5::VARCHAR(15), $6::TEXT, $7::TEXT[])`,
      [user.istid, user.name, user.email, user.alternativeEmail, user.phone, user.photo, user.courses]
    );
    if (!newUser) return null;
    newUser.roles = newUser.roles?.map(mapRoleToUserRole);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

export const updateUser = async (istid: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const { rows: [updatedUser] } = await db_query<User>(
      'SELECT * FROM neiist.update_user($1::VARCHAR(10), $2::JSONB)',
      [istid, JSON.stringify(updates)]
    );
    if (!updatedUser) return null;
    updatedUser.roles = updatedUser.roles?.map(mapRoleToUserRole);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const updateUserPhoto = async (istid: string, photoData: string): Promise<boolean> => {
  try {
    await db_query(
      'SELECT neiist.update_user_photo($1::VARCHAR(10), $2::TEXT)',
      [istid, photoData]
    );
    return true;
  } catch (error) {
    console.error('Error updating user photo:', error);
    return false;
  }
};

export const getUser = async (istid: string): Promise<User | null> => {
  try {
    const { rows: [user] } = await db_query<User>(
      'SELECT * FROM neiist.get_user($1::VARCHAR(10))', [istid]
    );
    return user ?? null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { rows } = await db_query<User>(
      'SELECT * FROM neiist.get_all_users()'
    );
    return rows;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const addMember = async (istid: string, department = 'Members', role = 'Member'): Promise<boolean> => {
  try {
    try {
      await db_query('SELECT neiist.add_department($1)', [department]);
      await db_query('SELECT neiist.add_team($1, $2)', [department, 'General membership team']);
      await db_query('SELECT neiist.add_valid_department_role($1, $2, $3)', [department, role, 'member']);
    } catch {
    }
    await db_query('SELECT neiist.add_team_member($1, $2, $3)', [istid, department, role]);
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    return false;
  }
};

export const addCollaborator = async (
  istid: string,
  teams: string[],
  position: string,
): Promise<boolean> => {
  try {
    for (const team of teams) {
      try {
        await db_query('SELECT neiist.add_valid_department_role($1, $2, $3)', [team, position, 'coordinator']);
      } catch {
      }
      await db_query('SELECT neiist.add_team_member($1, $2, $3)', [istid, team, position]);
    }
    return true;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return false;
  }
};

export const addAdmin = async (istid: string, adminDepartment = 'Administration', adminRole = 'Administrator'): Promise<boolean> => {
  try {
    try {
      await db_query('SELECT neiist.add_department($1)', [adminDepartment]);
      await db_query('SELECT neiist.add_admin_body($1)', [adminDepartment]);
      await db_query('SELECT neiist.add_valid_department_role($1, $2, $3)', [adminDepartment, adminRole, 'admin']);
    } catch {
    }

    await db_query('SELECT neiist.add_team_member($1, $2, $3)', [istid, adminDepartment, adminRole]);
    return true;
  } catch (error) {
    console.error('Error adding admin:', error);
    return false;
  }
};

export const removeAdminUser = async (istid: string, adminDepartment = 'Administration', adminRole = 'Administrator'): Promise<boolean> => {
  try {
    await db_query('SELECT neiist.remove_team_member($1, $2, $3)', [istid, adminDepartment, adminRole]);
    return true;
  } catch (error) {
    console.error('Error removing admin:', error);
    return false;
  }
};

export const removeRole = async (istid: string, department: string, role: string): Promise<boolean> => {
  try {
    await db_query('SELECT neiist.remove_team_member($1, $2, $3)', [istid, department, role]);
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
};

export const getUsersByAccess = async (access: string): Promise<User[]> => {
  try {
    const { rows } = await db_query<User>(
      'SELECT istid, name, email, phone, courses, campus, photo_path as photo FROM neiist.get_users_by_access($1)',
      [access]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching users by access:', error);
    return [];
  }
};

export const getDepartmentRoles = async (departmentName: string): Promise<Array<{role_name: string, access: string, active: boolean}>> => {
  try {
    const { rows } = await db_query<{role_name: string, access: string, active: boolean}>(
      'SELECT role_name, access, active FROM neiist.get_department_roles($1)',
      [departmentName]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching department roles:', error);
    return [];
  }
};
