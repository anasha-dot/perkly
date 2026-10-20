import pg from "pg";
import { localRoles, type LocalDatabaseName } from "./local.ts";
import type { SafeDatabaseTarget } from "./target.ts";

const databaseSql = {
  perkly: {
    create: "CREATE DATABASE perkly OWNER perkly_migrate",
    revokePublic: "REVOKE ALL ON DATABASE perkly FROM PUBLIC",
    grantMigrate: "GRANT CONNECT, TEMPORARY ON DATABASE perkly TO perkly_migrate",
    grantRuntime: "GRANT CONNECT ON DATABASE perkly TO perkly_runtime",
  },
  perkly_test: {
    create: "CREATE DATABASE perkly_test OWNER perkly_migrate",
    revokePublic: "REVOKE ALL ON DATABASE perkly_test FROM PUBLIC",
    grantMigrate: "GRANT CONNECT, TEMPORARY ON DATABASE perkly_test TO perkly_migrate",
    grantRuntime: "GRANT CONNECT ON DATABASE perkly_test TO perkly_runtime",
  },
} as const;

export function loopbackHost(host: string): string {
  return host === "localhost" ? "127.0.0.1" : host;
}

export async function withBootstrap<T>(
  target: SafeDatabaseTarget,
  work: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({
    host: loopbackHost(target.host),
    port: target.port,
    user: localRoles.bootstrap.user,
    password: localRoles.bootstrap.password,
    database: "postgres",
    connectionTimeoutMillis: 5_000,
  });
  try {
    await client.connect();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `Could not connect to local PostgreSQL as the bootstrap role. Start Compose with: docker compose -f infra/docker-compose.yml up -d --wait. ${reason}`,
      { cause: error },
    );
  }
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export async function ensureLocalRoles(client: pg.Client): Promise<void> {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'perkly_migrate') THEN
        CREATE ROLE perkly_migrate LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
          PASSWORD 'perkly_local_migrate';
      ELSE
        ALTER ROLE perkly_migrate LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
          PASSWORD 'perkly_local_migrate';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'perkly_runtime') THEN
        CREATE ROLE perkly_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
          PASSWORD 'perkly_local_runtime';
      ELSE
        ALTER ROLE perkly_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
          PASSWORD 'perkly_local_runtime';
      END IF;
    END
    $$;
  `);
}

export async function ensureLocalDatabase(
  client: pg.Client,
  database: LocalDatabaseName,
): Promise<void> {
  const statements = databaseSql[database];
  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (existing.rowCount === 0) {
    await client.query(statements.create);
  }
  await client.query(statements.revokePublic);
  await client.query(statements.grantMigrate);
  await client.query(statements.grantRuntime);
}

export async function dropAndCreateTestDatabase(client: pg.Client): Promise<void> {
  await ensureLocalRoles(client);
  await client.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'perkly_test' AND pid <> pg_backend_pid()",
  );
  await client.query("DROP DATABASE IF EXISTS perkly_test");
  await ensureLocalDatabase(client, "perkly_test");
}
