import { createHash, randomBytes, randomUUID } from "node:crypto";
import type pg from "pg";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  fixtureProfileId: string;
  email: string;
  locale: string;
  role: string;
  fictional: true;
  identityProvider: "local-fixtures";
};

export type CreatedSession = {
  token: string;
  csrfToken: string;
  expiresAt: Date;
  user: SessionUser;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createLocalFixtureSession(
  pool: pg.Pool,
  profileId: string,
): Promise<CreatedSession | undefined> {
  const profile = await pool.query<{
    id: string;
    email: string;
    locale: string;
    profile_role: string;
  }>(
    `SELECT id, email, locale, profile_role
     FROM app.fixture_profiles
     WHERE id = $1 AND fictional = true`,
    [profileId],
  );
  const row = profile.rows[0];
  if (row === undefined) {
    return undefined;
  }

  const userId = randomUUID();
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO app.users (id, fixture_profile_id, email, locale, profile_role, identity_provider)
     VALUES ($1, $2, $3, $4, $5, 'local-fixtures')
     ON CONFLICT (fixture_profile_id) DO NOTHING
     RETURNING id`,
    [userId, row.id, row.email, row.locale, row.profile_role],
  );
  const storedUserId =
    inserted.rows[0]?.id ??
    (
      await pool.query<{ id: string }>("SELECT id FROM app.users WHERE fixture_profile_id = $1", [
        row.id,
      ])
    ).rows[0]?.id;
  if (storedUserId === undefined) {
    return undefined;
  }

  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO app.sessions (id, user_id, token_hash, csrf_token, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), storedUserId, hashSessionToken(token), csrfToken, expiresAt],
  );

  return {
    token,
    csrfToken,
    expiresAt,
    user: {
      id: storedUserId,
      fixtureProfileId: row.id,
      email: row.email,
      locale: row.locale,
      role: row.profile_role,
      fictional: true,
      identityProvider: "local-fixtures",
    },
  };
}

export async function findActiveSession(
  pool: pg.Pool,
  token: string,
): Promise<{ csrfToken: string; user: SessionUser } | undefined> {
  const found = await pool.query<{
    csrf_token: string;
    id: string;
    fixture_profile_id: string;
    email: string;
    locale: string;
    profile_role: string;
  }>(
    `SELECT sessions.csrf_token, users.id, users.fixture_profile_id, users.email, users.locale, users.profile_role
     FROM app.sessions AS sessions
     JOIN app.users AS users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.revoked_at IS NULL
       AND sessions.expires_at > now()`,
    [hashSessionToken(token)],
  );
  const row = found.rows[0];
  if (row === undefined) {
    return undefined;
  }
  return {
    csrfToken: row.csrf_token,
    user: {
      id: row.id,
      fixtureProfileId: row.fixture_profile_id,
      email: row.email,
      locale: row.locale,
      role: row.profile_role,
      fictional: true,
      identityProvider: "local-fixtures",
    },
  };
}

export async function revokeSession(pool: pg.Pool, token: string): Promise<void> {
  await pool.query(
    `UPDATE app.sessions
     SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashSessionToken(token)],
  );
}
