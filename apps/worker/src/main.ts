import { EnvironmentConfigError, loadConfig } from "@perkly/integrations";

const config = loadStartupConfig();
console.log(
  `perkly-worker started. mode=${config.mode} identity=${config.adapters.identity} email=${config.adapters.email} search=${config.adapters.search} payment=${config.adapters.payment}. No job queue. Outbox rows are not sent.`,
);

const keepAlive = setInterval(() => {
  /* Idle until a later task adds the job queue. */
}, 60_000);

function shutdown(): void {
  clearInterval(keepAlive);
  console.log("perkly-worker stopped");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function loadStartupConfig() {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof EnvironmentConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
