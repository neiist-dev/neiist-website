import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

export const db_query = async <T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/* Example of a DB query using the pg lib and the above code

import { db_query } from '@/lib/db';
// Define the expected shape of the user data
interface User {
  id: number;
  name: string;
  email: string;
}
// Function to fetch a user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  const { rows } = await db_query<User>('SELECT id, name, email FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};*/
