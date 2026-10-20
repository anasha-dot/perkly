export const LOCAL_DEV_DATABASE = "perkly";
export const LOCAL_TEST_DATABASE = "perkly_test";

export const localRoles = {
  bootstrap: {
    user: "perkly_bootstrap",
    password: "perkly_local_bootstrap",
  },
  migrate: {
    user: "perkly_migrate",
    password: "perkly_local_migrate",
  },
  runtime: {
    user: "perkly_runtime",
    password: "perkly_local_runtime",
  },
} as const;

export type LocalRoleName = keyof typeof localRoles;
export type LocalDatabaseName = typeof LOCAL_DEV_DATABASE | typeof LOCAL_TEST_DATABASE;

const LOCAL_HOST = "127.0.0.1";
const LOCAL_PORT = 5432;

export function localRoleUrl(
  role: LocalRoleName,
  database: LocalDatabaseName | "postgres",
): string {
  const credentials = localRoles[role];
  return `postgres://${credentials.user}:${credentials.password}@${LOCAL_HOST}:${LOCAL_PORT}/${database}`;
}
