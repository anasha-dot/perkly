export const databaseStatus = "not_configured" as const;

export function databaseUnavailable(): never {
  throw new Error(
    "PostgreSQL is not configured. P01-02 adds the database, migrations, and the disposable test database. This build did not connect.",
  );
}
