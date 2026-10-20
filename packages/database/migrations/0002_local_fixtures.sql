-- Fictional local profiles, search fixtures, and the email outbox.
-- Seed writes these rows only for the loopback dev database. Nothing here is sent.

CREATE TABLE app.fixture_profiles (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('en', 'he', 'ar')),
  profile_role text NOT NULL CHECK (profile_role IN ('customer', 'cashier', 'manager', 'business_owner')),
  email text NOT NULL,
  fictional boolean NOT NULL DEFAULT true CHECK (fictional),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.email_outbox (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES app.fixture_profiles (id),
  to_address text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.search_fixtures (
  id text PRIMARY KEY,
  locale text NOT NULL CHECK (locale IN ('en', 'he', 'ar')),
  query text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON TABLE app.fixture_profiles, app.email_outbox, app.search_fixtures TO perkly_runtime;
