import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeDatabaseTarget,
  createPool,
  databaseUrlFromEnv,
  migrate,
  resetTestDatabase,
} from "@perkly/database";

test("native postgres smoke migrates the disposable database", { timeout: 60_000 }, async () => {
  const url = databaseUrlFromEnv("test");
  const target = assertSafeDatabaseTarget(url, "test");
  await resetTestDatabase(url);
  const migrated = await migrate(url);
  assert.equal(migrated.database, "perkly_test");
  assert.match(migrated.serverVersion, /PostgreSQL 17\./);
  assert.ok(migrated.applied.includes("0001_foundation"));
  assert.ok(migrated.applied.includes("0002_local_fixtures"));
  assert.ok(migrated.applied.includes("0003_audit_events"));
  assert.ok(migrated.applied.includes("0004_users_sessions"));
  assert.ok(migrated.applied.includes("0005_cognito_identity"));

  const pool = createPool("runtime", target);
  try {
    const proposal = await pool.query<{ postgres_major_proposal: number }>(
      "SELECT postgres_major_proposal FROM app.schema_info WHERE id = $1",
      [1],
    );
    assert.equal(proposal.rows[0]?.postgres_major_proposal, 17);
  } finally {
    await pool.end();
  }
});
