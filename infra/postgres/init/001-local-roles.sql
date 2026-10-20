-- Local non-production roles. The same statements are repeated by the migration
-- runner so a reset still works after this init script has already run.
-- Passwords match packages/database/src/local.ts and are not for a hosted database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'perkly_migrate') THEN
    CREATE ROLE perkly_migrate LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
      PASSWORD 'perkly_local_migrate';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'perkly_runtime') THEN
    CREATE ROLE perkly_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
      PASSWORD 'perkly_local_runtime';
  END IF;
END
$$;

SELECT 'CREATE DATABASE perkly OWNER perkly_migrate'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'perkly')\gexec

SELECT 'CREATE DATABASE perkly_test OWNER perkly_migrate'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'perkly_test')\gexec

REVOKE ALL ON DATABASE perkly FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE perkly TO perkly_migrate;
GRANT CONNECT ON DATABASE perkly TO perkly_runtime;

REVOKE ALL ON DATABASE perkly_test FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE perkly_test TO perkly_migrate;
GRANT CONNECT ON DATABASE perkly_test TO perkly_runtime;
