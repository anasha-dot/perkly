import { EnvironmentConfigError, createLogger, loadConfig } from "@perkly/integrations";

const log = createLogger("perkly-worker");
const config = loadStartupConfig();
let stopping = false;

log.info("started", {
  mode: config.mode,
  identity: config.adapters.identity,
  email: config.adapters.email,
  search: config.adapters.search,
  payment: config.adapters.payment,
});

const keepAlive = setInterval(() => {
  /* Idle until a later task adds the job queue. */
}, 60_000);

function shutdown(signal: string): void {
  if (stopping) {
    process.exit(1);
  }
  stopping = true;
  clearInterval(keepAlive);
  log.info("shutdown_complete", { signal });
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

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
