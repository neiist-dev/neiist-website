import { parseDatabaseError } from "@/lib/db/errorMapper";
import { Pool, QueryResult, QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { __neiistDbPool?: Pool };

const createPool = () => {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  p.on("error", (err) => console.error("[DB Pool] Idle client error:", err));
  return p;
};

const pool = (globalForDb.__neiistDbPool ??= createPool());

export const db_query = async <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error("Database query error:", error);
    throw parseDatabaseError(error);
  }
};

export default pool;
