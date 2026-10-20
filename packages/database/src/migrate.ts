import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  dropAndCreateTestDatabase,
  ensureLocalDatabase,
  ensureLocalRoles,
  loopbackHost,
  withBootstrap,
} from "./admin.ts";
import { localRoles, type LocalDatabaseName } from "./local.ts";
import { splitSqlStatements } from "./sql.ts";
import { assertSafeDatabaseTarget, databaseUrlFromEnv, type SafeDatabaseTarget } from "./target.ts";
import { withTransaction } from "./transaction.ts";

const MIGRATION_LOCK_KEY = 1700202601;
const MIGRATION_NAME = /^(\d{4}_[a-z0-9_]+)\.sql$/;

export type MigrationFile = {
  id: string;
  sql: string;
  checksum: string;
};

export type MigrateResult = {
  database: LocalDatabaseName;
  serverVersion: string;
  applied: string[];
  alreadyApplied: string[];
};

export async function migrate(url = databaseUrlFromEnv("migrate")): Promise<MigrateResult> {
  const target = assertSafeDatabaseTarget(url, "migrate");
  await withBootstrap(target, async (client) => {
    await ensureLocalRoles(client);
    await ensureLocalDatabase(client, target.database);
  });

  const pool = createPool("migrate", target);
  try {
    await ensureMigrationTable(pool);
    const files = await readMigrationFiles();
    const applied: string[] = [];
    const alreadyApplied: string[] = [];
    for (const file of files) {
      const outcome = await applyMigration(pool, file);
      if (outcome === "applied") {
        applied.push(file.id);
      } else {
        alreadyApplied.push(file.id);
      }
    }
    const version = await pool.query<{ version: string }>("SELECT version() AS version");
    const serverVersion = version.rows[0]?.version;
    if (serverVersion === undefined) {
      throw new Error("PostgreSQL did not report its version.");
    }
    assertProposedMajor(serverVersion);
    return {
      database: target.database,
      serverVersion,
      applied,
      alreadyApplied,
    };
  } finally {
    await pool.end();
  }
}

export async function resetTestDatabase(url = databaseUrlFromEnv("reset-test")): Promise<void> {
  const target = assertSafeDatabaseTarget(url, "reset-test");
  await withBootstrap(target, async (client) => {
    await dropAndCreateTestDatabase(client);
  });
}

export function createPool(role: "migrate" | "runtime", target: SafeDatabaseTarget): pg.Pool {
  const credentials = localRoles[role];
  return new pg.Pool({
    host: loopbackHost(target.host),
    port: target.port,
    user: credentials.user,
    password: credentials.password,
    database: target.database,
    max: 4,
    connectionTimeoutMillis: 5_000,
  });
}

async function ensureMigrationTable(pool: pg.Pool): Promise<void> {
  await withTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query("CREATE SCHEMA IF NOT EXISTS perkly_meta");
    await client.query("REVOKE ALL ON SCHEMA perkly_meta FROM PUBLIC");
    await client.query(`
      CREATE TABLE IF NOT EXISTS perkly_meta.schema_migrations (
        id text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query("REVOKE ALL ON perkly_meta.schema_migrations FROM PUBLIC");
  });
}

async function applyMigration(
  pool: pg.Pool,
  file: MigrationFile,
): Promise<"applied" | "already-applied"> {
  return withTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_KEY]);
    const existing = await client.query<{ checksum: string }>(
      "SELECT checksum FROM perkly_meta.schema_migrations WHERE id = $1",
      [file.id],
    );
    const row = existing.rows[0];
    if (row !== undefined) {
      if (row.checksum !== file.checksum) {
        throw new Error(
          `Migration ${file.id} was already applied with a different checksum. Refusing to continue.`,
        );
      }
      return "already-applied";
    }
    for (const statement of splitSqlStatements(file.sql)) {
      await client.query(statement);
    }
    await client.query("INSERT INTO perkly_meta.schema_migrations (id, checksum) VALUES ($1, $2)", [
      file.id,
      file.checksum,
    ]);
    return "applied";
  });
}

export async function readMigrationFiles(): Promise<MigrationFile[]> {
  const directory = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../migrations");
  const entries = await readdir(directory);
  const files = entries.filter((name) => name.endsWith(".sql")).sort();
  const migrations: MigrationFile[] = [];
  for (const name of files) {
    const match = MIGRATION_NAME.exec(name);
    if (match === null) {
      throw new Error(`Migration file ${name} must look like 0001_name.sql.`);
    }
    const id = match[1];
    if (id === undefined) {
      throw new Error(`Migration file ${name} has no id.`);
    }
    const sql = await readFile(path.join(directory, name), "utf8");
    migrations.push({
      id,
      sql,
      checksum: createHash("sha256").update(sql).digest("hex"),
    });
  }
  return migrations;
}

function assertProposedMajor(serverVersion: string): void {
  const match = /PostgreSQL (\d+)\./.exec(serverVersion);
  const major = match === null ? Number.NaN : Number(match[1]);
  if (major !== 17) {
    throw new Error(
      `The local database reported "${serverVersion}". Compose proposes major 17. O-03 stays open for the RDS check.`,
    );
  }
}
