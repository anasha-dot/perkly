import { FIXTURE_OUTBOX_MESSAGE, FIXTURE_PROFILES, loadConfig } from "@perkly/integrations";
import { SEARCH_FIXTURES } from "@perkly/search";
import { createPool } from "./migrate.ts";
import { assertSafeDatabaseTarget, databaseUrlFromEnv } from "./target.ts";
import { withTransaction } from "./transaction.ts";

export type SeedResult = {
  database: "perkly";
  profiles: number;
  outbox: number;
  searchFixtures: number;
};

export async function seedLocal(url = databaseUrlFromEnv("seed-local")): Promise<SeedResult> {
  const target = assertSafeDatabaseTarget(url, "seed-local");
  const configEnv: NodeJS.ProcessEnv = { ...process.env };
  delete configEnv.DATABASE_URL;
  const config = loadConfig({
    ...configEnv,
    APP_MODE: process.env.APP_MODE ?? "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
  });
  if (
    config.mode !== "local" ||
    config.adapters.identity !== "local-fixtures" ||
    config.adapters.email !== "outbox"
  ) {
    throw new Error(
      "Refused: fictional seed runs only when local fixture identity and the email outbox are selected.",
    );
  }

  const pool = createPool("migrate", target);
  try {
    await withTransaction(pool, async (client) => {
      for (const profile of FIXTURE_PROFILES) {
        await client.query(
          `INSERT INTO app.fixture_profiles (id, display_name, locale, profile_role, email)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [profile.id, profile.displayName, profile.locale, profile.role, profile.email],
        );
      }
      await client.query(
        `INSERT INTO app.email_outbox (id, profile_id, to_address, subject, body)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          FIXTURE_OUTBOX_MESSAGE.id,
          FIXTURE_OUTBOX_MESSAGE.profileId,
          FIXTURE_OUTBOX_MESSAGE.toAddress,
          FIXTURE_OUTBOX_MESSAGE.subject,
          FIXTURE_OUTBOX_MESSAGE.body,
        ],
      );
      for (const fixture of SEARCH_FIXTURES) {
        await client.query(
          `INSERT INTO app.search_fixtures (id, locale, query, note)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [fixture.id, fixture.locale, fixture.query, fixture.note],
        );
      }
    });

    const profiles = await pool.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM app.fixture_profiles",
    );
    const outbox = await pool.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM app.email_outbox",
    );
    const searchFixtures = await pool.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM app.search_fixtures",
    );
    return {
      database: "perkly",
      profiles: Number(profiles.rows[0]?.n ?? 0),
      outbox: Number(outbox.rows[0]?.n ?? 0),
      searchFixtures: Number(searchFixtures.rows[0]?.n ?? 0),
    };
  } finally {
    await pool.end();
  }
}
