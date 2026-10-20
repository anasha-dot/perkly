import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeDatabaseTarget,
  createPool,
  databaseUrlFromEnv,
  localRoleUrl,
  migrate,
  resetTestDatabase,
  seedLocal,
  withTransaction,
} from "@perkly/database";

test(
  "a fresh disposable database migrates twice the same way, and the runtime role cannot change schema",
  { timeout: 120_000 },
  async () => {
    const url = databaseUrlFromEnv("test");
    const target = assertSafeDatabaseTarget(url, "test");

    await resetTestDatabase(url);
    const first = await migrate(url);
    assert.equal(first.database, "perkly_test");
    assert.deepEqual(first.applied, [
      "0001_foundation",
      "0002_local_fixtures",
      "0003_audit_events",
    ]);
    assert.match(first.serverVersion, /PostgreSQL 17\./);
    const firstSnapshot = await readSnapshot(target);

    const second = await migrate(url);
    assert.deepEqual(second.applied, []);
    assert.deepEqual(second.alreadyApplied, [
      "0001_foundation",
      "0002_local_fixtures",
      "0003_audit_events",
    ]);
    assert.deepEqual(await readSnapshot(target), firstSnapshot);

    await resetTestDatabase(url);
    const third = await migrate(url);
    assert.deepEqual(third.applied, [
      "0001_foundation",
      "0002_local_fixtures",
      "0003_audit_events",
    ]);
    assert.equal(third.serverVersion, first.serverVersion);
    assert.deepEqual(await readSnapshot(target), firstSnapshot);

    const migratePool = createPool("migrate", target);
    const runtimePool = createPool("runtime", target);
    try {
      await withTransaction(migratePool, async (client) => {
        await client.query("CREATE TABLE app.tx_probe (id integer PRIMARY KEY)");
        await client.query("INSERT INTO app.tx_probe (id) VALUES ($1)", [1]);
      });
      const committed = await migratePool.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM app.tx_probe",
      );
      assert.equal(Number(committed.rows[0]?.n), 1);

      await assert.rejects(
        withTransaction(migratePool, async (client) => {
          await client.query("INSERT INTO app.tx_probe (id) VALUES ($1)", [2]);
          throw new Error("force rollback");
        }),
        /force rollback/,
      );
      const rolledBack = await migratePool.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM app.tx_probe",
      );
      assert.equal(Number(rolledBack.rows[0]?.n), 1);
      await migratePool.query("DROP TABLE app.tx_probe");

      const marker = await runtimePool.query<{ postgres_major_proposal: number }>(
        "SELECT postgres_major_proposal FROM app.schema_info WHERE id = $1",
        [1],
      );
      assert.equal(marker.rows[0]?.postgres_major_proposal, 17);
      await expectSqlState(
        runtimePool.query("CREATE TABLE app.runtime_must_not_create (id integer)"),
        "42501",
      );
      await expectSqlState(
        runtimePool.query(
          "INSERT INTO app.schema_info (id, postgres_major_proposal, note) VALUES (2, 17, 'no')",
        ),
        "42501",
      );
      await expectSqlState(
        runtimePool.query(
          "INSERT INTO perkly_meta.schema_migrations (id, checksum) VALUES ('x', 'y')",
        ),
        "42501",
      );

      const inserted = await runtimePool.query<{ id: string; action: string }>(
        `INSERT INTO app.audit_events (actor, action, subject, request_id)
         VALUES ('fixture-system', 'foundation.ready', 'app.schema_info', 'req_audit_test')
         RETURNING id::text AS id, action`,
      );
      const auditId = inserted.rows[0]?.id;
      assert.equal(inserted.rows[0]?.action, "foundation.ready");
      await expectSqlState(
        runtimePool.query("UPDATE app.audit_events SET action = 'changed' WHERE id = $1", [
          auditId,
        ]),
        "42501",
      );
      await expectSqlState(
        runtimePool.query("DELETE FROM app.audit_events WHERE id = $1", [auditId]),
        "42501",
      );
      await expectSqlState(runtimePool.query("TRUNCATE app.audit_events"), "42501");
      await expectSqlState(
        runtimePool.query("ALTER TABLE app.audit_events ADD COLUMN leaked text"),
        "42501",
      );
      await expectSqlState(
        migratePool.query("UPDATE app.audit_events SET action = 'changed'"),
        "42501",
      );
      const unchanged = await runtimePool.query<{ action: string }>(
        "SELECT action FROM app.audit_events WHERE id = $1",
        [auditId],
      );
      assert.equal(unchanged.rows[0]?.action, "foundation.ready");
    } finally {
      await runtimePool.end();
      await migratePool.end();
    }
  },
);

test(
  "local seed is idempotent and the runtime role cannot write fixtures",
  { timeout: 60_000 },
  async () => {
    const url = localRoleUrl("migrate", "perkly");
    await migrate(url);
    const first = await seedLocal(url);
    const second = await seedLocal(url);
    assert.equal(first.database, "perkly");
    assert.equal(first.profiles, 5);
    assert.equal(first.outbox, 1);
    assert.equal(first.searchFixtures, 3);
    assert.deepEqual(second, first);

    const target = assertSafeDatabaseTarget(url, "seed-local");
    const migratePool = createPool("migrate", target);
    const runtimePool = createPool("runtime", target);
    try {
      const outbox = await migratePool.query<{ body: string }>(
        "SELECT body FROM app.email_outbox WHERE id = $1",
        ["fixture-outbox-seed"],
      );
      assert.match(outbox.rows[0]?.body ?? "", /was not sent/);
      const columns = await migratePool.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'app' AND table_name = 'fixture_profiles'`,
      );
      assert.equal(
        columns.rows.some((row) => row.column_name === "password"),
        false,
      );
      await expectSqlState(
        runtimePool.query(
          "INSERT INTO app.fixture_profiles (id, display_name, locale, profile_role, email) VALUES ('x', 'X', 'en', 'customer', 'x@example.com')",
        ),
        "42501",
      );
    } finally {
      await runtimePool.end();
      await migratePool.end();
    }
  },
);

async function readSnapshot(target: ReturnType<typeof assertSafeDatabaseTarget>): Promise<{
  tables: string[];
  migrations: Array<{ id: string; checksum: string }>;
  proposal: number;
}> {
  const pool = createPool("migrate", target);
  try {
    const tables = await pool.query<{ name: string }>(
      `SELECT table_schema || '.' || table_name AS name
       FROM information_schema.tables
       WHERE table_schema IN ('app', 'perkly_meta')
       ORDER BY 1`,
    );
    const migrations = await pool.query<{ id: string; checksum: string }>(
      "SELECT id, checksum FROM perkly_meta.schema_migrations ORDER BY id",
    );
    const proposal = await pool.query<{ postgres_major_proposal: number }>(
      "SELECT postgres_major_proposal FROM app.schema_info WHERE id = 1",
    );
    return {
      tables: tables.rows.map((row) => row.name),
      migrations: migrations.rows.map((row) => ({ id: row.id, checksum: row.checksum })),
      proposal: proposal.rows[0]?.postgres_major_proposal ?? 0,
    };
  } finally {
    await pool.end();
  }
}

async function expectSqlState(pending: Promise<unknown>, code: string): Promise<void> {
  try {
    await pending;
  } catch (error) {
    assert.equal(sqlState(error), code);
    return;
  }
  assert.fail(`expected SQLSTATE ${code}`);
}

function sqlState(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
