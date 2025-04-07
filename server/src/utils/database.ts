import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool();

export const query = async <T extends QueryResultRow,>(text: string, ...params: unknown[]): Promise<QueryResult<T>> => pool.query<T>(text, params);

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export interface DatabaseError {
  code: string;
  // TODO include more as needed
  // detail: string; // Example
}

export const isDatabaseException = (err: unknown): err is DatabaseError => {
  if (err instanceof Error) {
    const dbError = err as unknown as DatabaseError;
    return (
      dbError.code !== undefined &&
      // dbError.detail !== undefined && // Example
      typeof dbError.code === 'string'
      // typeof dbError.detail === 'string' // Example
    );
  }
  return false;
}
