-- Local foundation. PostgreSQL 17 is the Compose image proposal. O-03 stays open
-- until the RDS major is checked in the chosen account and region.
-- The migration role owns this schema. The runtime role can read the marker
-- and cannot change it.

CREATE SCHEMA IF NOT EXISTS app;

COMMENT ON SCHEMA app IS
  'Perkly application schema. Owned by perkly_migrate. PostgreSQL 17 is the local proposal; O-03 is open.';

CREATE TABLE app.schema_info (
  id integer PRIMARY KEY,
  postgres_major_proposal integer NOT NULL,
  note text NOT NULL,
  CONSTRAINT schema_info_singleton CHECK (id = 1)
);

INSERT INTO app.schema_info (id, postgres_major_proposal, note)
VALUES (
  1,
  17,
  'Local Compose uses the postgres:17 image as the roadmap proposal. O-03 stays open until the RDS major is checked.'
);

REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO perkly_runtime;
GRANT SELECT ON TABLE app.schema_info TO perkly_runtime;
