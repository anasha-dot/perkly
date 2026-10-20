-- Cognito users are separate from fictional local profiles.
-- OAuth state, nonce, and the PKCE verifier are stored as hashes.
-- The verifier itself is kept only until the callback consumes the flow.

ALTER TABLE app.users DROP CONSTRAINT users_identity_provider_check;
ALTER TABLE app.users DROP CONSTRAINT users_profile_role_check;
ALTER TABLE app.users ALTER COLUMN fixture_profile_id DROP NOT NULL;
ALTER TABLE app.users ADD COLUMN subject text;
ALTER TABLE app.users ADD COLUMN pool text;
ALTER TABLE app.users ADD COLUMN email_verified_at timestamptz;

ALTER TABLE app.users ADD CONSTRAINT users_profile_role_check CHECK (
  profile_role IN ('customer', 'cashier', 'manager', 'business_owner', 'admin_pool')
);

ALTER TABLE app.users ADD CONSTRAINT users_identity_shape CHECK (
  (
    identity_provider = 'local-fixtures'
    AND fixture_profile_id IS NOT NULL
    AND subject IS NULL
    AND pool IS NULL
  )
  OR
  (
    identity_provider = 'cognito'
    AND fixture_profile_id IS NULL
    AND subject IS NOT NULL
    AND pool IN ('customer', 'admin')
    AND email_verified_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX users_cognito_identity_idx ON app.users (pool, subject);

ALTER TABLE app.sessions ADD COLUMN refresh_token text;

CREATE TABLE app.oauth_flows (
  id text PRIMARY KEY,
  pool text NOT NULL CHECK (pool IN ('customer', 'admin')),
  state_hash text NOT NULL UNIQUE,
  nonce_hash text NOT NULL,
  code_verifier_hash text NOT NULL,
  code_verifier text,
  redirect_uri text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON TABLE app.oauth_flows TO perkly_runtime;
