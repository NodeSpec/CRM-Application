import pg from "pg";
import { config } from "../config.js";

/**
 * Shared PostgreSQL connection pool (CRM Persistence contract).
 * Uses connection pooling per the technology guidance; all queries go through
 * this pool with parameterized SQL to prevent injection.
 */
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  // A pooled client errored while idle — log and let the pool recover.
  console.error("[db] unexpected idle client error", err);
});

/** Convenience helper for parameterized queries. */
export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params as pg.QueryConfigValues<unknown[]>);
}
