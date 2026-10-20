-- Local fictional users and server sessions.
-- The session token is not stored. token_hash is the SHA-256 of the opaque cookie.
-- There is no password column. This is not production authentication.

CREATE TABLE app.users (
  id text PRIMARY KEY,
  fixture_profile_id text NOT NULL UNIQUE REFERENCES app.fixture_profiles (id),
  email text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('en', 'he', 'ar')),
  profile_role text NOT NULL CHECK (profile_role IN ('customer', 'cashier', 'manager', 'business_owner')),
  identity_provider text NOT NULL CHECK (identity_provider = 'local-fixtures'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES app.users (id),
  token_hash text NOT NULL UNIQUE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON app.sessions (user_id);

GRANT SELECT, INSERT ON TABLE app.users TO perkly_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE app.sessions TO perkly_runtime;
