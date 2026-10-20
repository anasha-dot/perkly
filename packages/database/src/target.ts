import {
  LOCAL_DEV_DATABASE,
  LOCAL_TEST_DATABASE,
  localRoleUrl,
  type LocalDatabaseName,
} from "./local.ts";

export type DatabasePurpose = "migrate" | "seed-local" | "test" | "reset-test";

export type SafeDatabaseTarget = {
  host: string;
  port: number;
  database: LocalDatabaseName;
  purpose: DatabasePurpose;
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const HOSTED_MARKERS = [
  "amazonaws.com",
  "neon.tech",
  "supabase.co",
  "supabase.com",
  "azure.com",
  "render.com",
  "digitalocean.com",
  "cloudsql",
];

export class UnsafeDatabaseTargetError extends Error {
  readonly code = "unsafe_database_target";

  constructor(message: string) {
    super(message);
    this.name = "UnsafeDatabaseTargetError";
  }
}

export function assertSafeDatabaseTarget(
  urlString: string,
  purpose: DatabasePurpose,
): SafeDatabaseTarget {
  const mode = process.env.APP_MODE;
  if (mode === "staging" || mode === "production") {
    throw new UnsafeDatabaseTargetError(
      "Refused: APP_MODE is hosted. This command only accepts a loopback disposable database.",
    );
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new UnsafeDatabaseTargetError("Refused: the database URL could not be parsed.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new UnsafeDatabaseTargetError("Refused: only a postgres URL is accepted.");
  }

  const lowered = urlString.toLowerCase();
  if (HOSTED_MARKERS.some((marker) => lowered.includes(marker))) {
    throw new UnsafeDatabaseTargetError("Refused: the URL points at a hosted database.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new UnsafeDatabaseTargetError(`Refused: host "${host || "(empty)"}" is not loopback.`);
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[a-z][a-z0-9_]*$/.test(database)) {
    throw new UnsafeDatabaseTargetError("Refused: the database name is not a plain identifier.");
  }
  if (/prod|staging|live|rds/.test(database)) {
    throw new UnsafeDatabaseTargetError(
      "Refused: the database name looks like a hosted environment.",
    );
  }

  if (!isLocalDatabase(database) || !allowedDatabases(purpose).includes(database)) {
    const allowed = allowedDatabases(purpose);
    throw new UnsafeDatabaseTargetError(
      `Refused: ${purpose} may only use ${allowed.join(" or ")}. "${database}" is not that database.`,
    );
  }

  const port = url.port === "" ? 5432 : Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new UnsafeDatabaseTargetError("Refused: the port is not valid.");
  }

  return {
    host,
    port,
    database: database as LocalDatabaseName,
    purpose,
  };
}

function isLocalDatabase(value: string): value is LocalDatabaseName {
  return value === LOCAL_DEV_DATABASE || value === LOCAL_TEST_DATABASE;
}

function allowedDatabases(purpose: DatabasePurpose): readonly LocalDatabaseName[] {
  if (purpose === "migrate") {
    return [LOCAL_DEV_DATABASE, LOCAL_TEST_DATABASE];
  }
  if (purpose === "seed-local") {
    return [LOCAL_DEV_DATABASE];
  }
  return [LOCAL_TEST_DATABASE];
}

export function databaseUrlFromEnv(purpose: DatabasePurpose): string {
  const configured = process.env.DATABASE_URL;
  if (configured !== undefined && configured.trim() !== "") {
    return configured;
  }
  if (purpose === "seed-local" || purpose === "migrate") {
    return localRoleUrl("migrate", LOCAL_DEV_DATABASE);
  }
  return localRoleUrl("migrate", LOCAL_TEST_DATABASE);
}
