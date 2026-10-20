import { EnvironmentConfigError, createLogger, loadConfig } from "@perkly/integrations";
import { createApp, setShuttingDown } from "./app.ts";
import { closeHttpServer } from "./shutdown.ts";

const log = createLogger("perkly-api");
const config = loadStartupConfig();
const databaseUrl = readDatabaseUrl();
let stopping = false;

const server = createApp(config, databaseUrl === undefined ? {} : { databaseUrl }).listen(
  config.port,
  config.host,
  () => {
    log.info("listening", {
      host: config.host,
      port: config.port,
      mode: config.mode,
      identity: config.adapters.identity,
      email: config.adapters.email,
      search: config.adapters.search,
      payment: config.adapters.payment,
    });
  },
);

async function shutdown(signal: string): Promise<void> {
  if (stopping) {
    process.exit(1);
  }
  stopping = true;
  setShuttingDown(true);
  log.info("shutdown_started", { signal });
  await closeHttpServer(server);
  log.info("shutdown_complete", { signal });
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
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

function readDatabaseUrl(): string | undefined {
  const value = process.env.DATABASE_URL;
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}
