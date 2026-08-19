import { parseDatabaseError } from "@/lib/db/errorMapper";
import { Pool, QueryResult, QueryResultRow } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.warn(`[DB Pool] Received ${signal}. Closing database connection pool...`);
  try {
    await pool.end();
    console.warn("[DB Pool] Database pool closed successfully.");
  } catch (err) {
    console.error("[DB Pool] Error closing database pool:", err);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

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
