-- Tenant membership and admin grants are server authority.
-- A customer-pool session is not an admin grant.
-- The runtime role can read membership and grants. It cannot write them.
-- Rate buckets are counters. They are not a billing ledger.

CREATE TABLE app.businesses (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  fictional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.staff_memberships (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES app.businesses (id),
  role text NOT NULL CHECK (role IN ('cashier', 'manager', 'business_owner')),
  user_id text REFERENCES app.users (id),
  fixture_profile_id text REFERENCES app.fixture_profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (user_id IS NOT NULL AND fixture_profile_id IS NULL)
    OR (user_id IS NULL AND fixture_profile_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX staff_memberships_fixture_idx
  ON app.staff_memberships (business_id, fixture_profile_id, role)
  WHERE fixture_profile_id IS NOT NULL;

CREATE UNIQUE INDEX staff_memberships_user_idx
  ON app.staff_memberships (business_id, user_id, role)
  WHERE user_id IS NOT NULL;

CREATE TABLE app.admin_grants (
  user_id text PRIMARY KEY REFERENCES app.users (id),
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.rate_buckets (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits >= 0)
);

GRANT SELECT ON TABLE app.businesses, app.staff_memberships, app.admin_grants TO perkly_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE app.rate_buckets TO perkly_runtime;
