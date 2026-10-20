import { migrate, resetTestDatabase, seedLocal, type MigrateResult } from "./migrate.ts";
import { UnsafeDatabaseTargetError } from "./target.ts";

const command = process.argv[2];

try {
  if (command === "migrate") {
    printMigrateResult(await migrate());
  } else if (command === "reset-test") {
    await resetTestDatabase();
    console.log(
      "Reset the disposable test database perkly_test. It is empty until db:migrate runs.",
    );
  } else if (command === "seed-local") {
    seedLocal();
    console.log(
      "Accepted the local dev database perkly. No seed rows exist in this task. Nothing was written. Fictional seed is P01-03.",
    );
  } else {
    console.error("Usage: cli.ts migrate | reset-test | seed-local");
    process.exit(1);
  }
} catch (error) {
  if (error instanceof UnsafeDatabaseTargetError) {
    console.error(error.message);
    process.exit(1);
  }
  const message = error instanceof Error ? error.message : "Database command failed.";
  console.error(message);
  process.exit(1);
}

function printMigrateResult(result: MigrateResult): void {
  console.log(`database: ${result.database}`);
  console.log(`server_version: ${result.serverVersion}`);
  console.log(`applied: ${result.applied.join(", ") || "(none)"}`);
  console.log(`already_applied: ${result.alreadyApplied.join(", ") || "(none)"}`);
}
