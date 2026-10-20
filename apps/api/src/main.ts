import { EnvironmentConfigError, loadConfig } from "@perkly/integrations";
import { createApp } from "./app.ts";

const config = loadStartupConfig();
const server = createApp(config).listen(config.port, config.host, () => {
  console.log(
    `perkly-api listening on http://${config.host}:${config.port} mode=${config.mode} identity=${config.adapters.identity} email=${config.adapters.email} search=${config.adapters.search} payment=${config.adapters.payment}`,
  );
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
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
