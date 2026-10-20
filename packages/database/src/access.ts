import type pg from "pg";

export const AUTH_RATE_LIMIT = 180;
export const AUTH_RATE_WINDOW_SECONDS = 60;
export const ACCESS_RATE_LIMIT = 60;
export const ACCESS_RATE_WINDOW_SECONDS = 60;

export async function staffRolesForActor(
  pool: pg.Pool,
  businessId: string,
  actor: { userId: string; fixtureProfileId: string | null },
): Promise<string[]> {
  const found = await pool.query<{ role: string }>(
    `SELECT role
     FROM app.staff_memberships
     WHERE business_id = $1
       AND (
         user_id = $2
         OR ($3::text IS NOT NULL AND fixture_profile_id = $3)
       )`,
    [businessId, actor.userId, actor.fixtureProfileId],
  );
  return found.rows.map((row) => row.role);
}

export async function adminGrantExists(pool: pg.Pool, userId: string): Promise<boolean> {
  const found = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM app.admin_grants WHERE user_id = $1",
    [userId],
  );
  return found.rows.length > 0;
}

export async function consumeRateLimit(
  pool: pg.Pool,
  bucketKey: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const consumed = await pool.query<{ hits: number }>(
    `INSERT INTO app.rate_buckets AS buckets (bucket_key, window_started_at, hits)
     VALUES ($1, now(), 1)
     ON CONFLICT (bucket_key) DO UPDATE
     SET hits = CASE
           WHEN buckets.window_started_at <= now() - make_interval(secs => $2::int) THEN 1
           ELSE buckets.hits + 1
         END,
         window_started_at = CASE
           WHEN buckets.window_started_at <= now() - make_interval(secs => $2::int) THEN now()
           ELSE buckets.window_started_at
         END
     RETURNING hits`,
    [bucketKey, windowSeconds],
  );
  const hits = Number(consumed.rows[0]?.hits ?? limit + 1);
  return hits <= limit;
}
