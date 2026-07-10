import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";
import { config } from "../config.js";

/**
 * Versioned migration runner (REQ-017).
 *
 * Applies every pending numbered `*.up.sql` migration in `MIGRATIONS_DIR` in
 * lexical order, each inside its own transaction, recording applied versions in
 * a `schema_migrations` table. Called on startup BEFORE the server accepts
 * traffic (REQ-017 AC2). Down-migrations (`*.down.sql`) are shipped alongside
 * for rollback (REQ-017 AC3) and can be applied by `rollback()`.
 */
const MIGRATIONS_TABLE = "schema_migrations";

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version     TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function appliedVersions(): Promise<Set<string>> {
  const { rows } = await pool.query<{ version: string }>(
    `SELECT version FROM ${MIGRATIONS_TABLE}`
  );
  return new Set(rows.map((r) => r.version));
}

/** Returns sorted migration "versions" (filename prefix before `.up.sql`). */
async function listMigrations(suffix: ".up.sql" | ".down.sql") {
  const dir = config.MIGRATIONS_DIR;
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(suffix))
    .sort();
  return files.map((file) => ({
    version: file.slice(0, -suffix.length),
    file: path.join(dir, file),
  }));
}

export async function migrate(): Promise<void> {
  await ensureMigrationsTable();
  const done = await appliedVersions();
  const migrations = await listMigrations(".up.sql");
  const pending = migrations.filter((m) => !done.has(m.version));

  if (pending.length === 0) {
    console.log(`[migrate] schema up to date (${migrations.length} applied)`);
    return;
  }

  for (const m of pending) {
    const sql = await readFile(m.file, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (version) VALUES ($1)`,
        [m.version]
      );
      await client.query("COMMIT");
      console.log(`[migrate] applied ${m.version}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[migrate] FAILED ${m.version} — rolled back`, err);
      throw err;
    } finally {
      client.release();
    }
  }
  console.log(`[migrate] applied ${pending.length} migration(s)`);
}

/** Roll back the most recently applied migration (REQ-017 AC3). */
export async function rollback(): Promise<void> {
  await ensureMigrationsTable();
  const { rows } = await pool.query<{ version: string }>(
    `SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version DESC LIMIT 1`
  );
  const last = rows[0]?.version;
  if (!last) {
    console.log("[migrate] nothing to roll back");
    return;
  }
  const downs = await listMigrations(".down.sql");
  const down = downs.find((d) => d.version === last);
  if (!down) throw new Error(`No down-migration found for ${last}`);

  const sql = await readFile(down.file, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [
      last,
    ]);
    await client.query("COMMIT");
    console.log(`[migrate] rolled back ${last}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Allow running standalone: `tsx src/db/migrate.ts [up|down]`.
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] ?? "up";
  const run = cmd === "down" ? rollback : migrate;
  run()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
