import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeDatabaseTarget, databaseUrlFromEnv } from "@perkly/database";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = databaseUrlFromEnv("test");

try {
  assertSafeDatabaseTarget(url, "test");
} catch (error) {
  const message = error instanceof Error ? error.message : "Refused.";
  console.error(message);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", "tests/integration/database.test.ts"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: url,
  },
});

process.exit(result.status ?? 1);
