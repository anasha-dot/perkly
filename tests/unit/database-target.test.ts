import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  assertSafeDatabaseTarget,
  localRoleUrl,
  splitSqlStatements,
  UnsafeDatabaseTargetError,
} from "@perkly/database";

test("migrate may use the local dev or disposable test database", () => {
  const dev = assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly"), "migrate");
  const disposable = assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly_test"), "migrate");
  assert.equal(dev.database, "perkly");
  assert.equal(disposable.database, "perkly_test");
  assert.equal(dev.host, "127.0.0.1");
});

test("seed accepts only the local dev database", () => {
  assert.equal(
    assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly"), "seed-local").database,
    "perkly",
  );
  assert.throws(
    () => assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly_test"), "seed-local"),
    UnsafeDatabaseTargetError,
  );
});

test("test and reset accept only the disposable test database on loopback", () => {
  assert.equal(
    assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly_test"), "reset-test").database,
    "perkly_test",
  );
  assert.throws(
    () => assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly"), "reset-test"),
    /perkly_test/,
  );
  assert.throws(
    () => assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly"), "test"),
    /perkly_test/,
  );
});

test("hosted hosts and hosted modes are refused before any connection", () => {
  assert.throws(
    () =>
      assertSafeDatabaseTarget(
        "postgres://perkly_migrate:secret@perkly.abc123.us-east-1.rds.amazonaws.com:5432/perkly_test",
        "reset-test",
      ),
    /hosted database/,
  );
  assert.throws(
    () =>
      assertSafeDatabaseTarget(
        "postgres://perkly_migrate:secret@203.0.113.10:5432/perkly_test",
        "test",
      ),
    /not loopback/,
  );
  const previous = process.env.APP_MODE;
  process.env.APP_MODE = "production";
  try {
    assert.throws(
      () => assertSafeDatabaseTarget(localRoleUrl("migrate", "perkly_test"), "reset-test"),
      /APP_MODE is hosted/,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.APP_MODE;
    } else {
      process.env.APP_MODE = previous;
    }
  }
});

test("reset command rejects a hosted URL and does not print the password", () => {
  const result = spawnSync(process.execPath, ["packages/database/src/cli.ts", "reset-test"], {
    encoding: "utf8",
    env: {
      ...process.env,
      APP_MODE: "local",
      DATABASE_URL:
        "postgres://perkly_migrate:secret@perkly.abc123.us-east-1.rds.amazonaws.com:5432/perkly_test",
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refused/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret/);
});

test("seed command rejects a hosted URL and does not print the password", () => {
  const result = spawnSync(process.execPath, ["packages/database/src/cli.ts", "seed-local"], {
    encoding: "utf8",
    env: {
      ...process.env,
      APP_MODE: "local",
      DATABASE_URL: "postgres://perkly_migrate:secret@203.0.113.20:5432/perkly",
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refused/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret/);
});

test("reset command rejects the dev database", () => {
  const result = spawnSync(process.execPath, ["packages/database/src/cli.ts", "reset-test"], {
    encoding: "utf8",
    env: {
      ...process.env,
      APP_MODE: "local",
      DATABASE_URL: localRoleUrl("migrate", "perkly"),
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /perkly_test/);
});

test("sql files split into statements without breaking quoted semicolons", () => {
  const statements = splitSqlStatements(
    "-- note\nCREATE TABLE app.example (note text);\nINSERT INTO app.example (note) VALUES ('a; b');\n",
  );
  assert.equal(statements.length, 2);
  assert.match(statements[1] ?? "", /a; b/);
});
